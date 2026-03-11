import { Container, ContainerPorts, getVariant, getVersion, OGSHError, sanitiseDaemon } from "@open-game-server-host/backend-lib";
import { QueryResult } from "pg";
import { segmentReserveMethod, SegmentReserveMethod } from "../../daemon/daemon.js";
import { CONTAINER_ALL_PERMISSION, ContainerPermission, CreateContainerData } from "../../interfaces/container.js";
import { DATABASE, Database } from "../db.js";
import { PostgresClient, PostgresDb } from "./postgresDb.js";

export class PostgresContainerDb extends PostgresDb implements Partial<Database> {
    private async convertRowToContainer(row: any): Promise<Container> {
        const portsResult = await this.query(`
            SELECT
                c.host_port,
                c.container_port,
                ips.version
            FROM container_ports c
            JOIN ips ON c.ip_id = ips.id
            WHERE container_id = $1
        `,
            row.id
        );
        const ports: ContainerPorts = {};
        portsResult.rows.forEach(row => {
            if (!ports[row.version]) {
                ports[row.version] = [];
            }
            ports[row.version].push({
                containerPort: row.container_port,
                hostPort: row.host_port
            });
        });

        return {
            appId: row.app_id,
            contractLengthDays: row.contract_length_days,
            createdAt: +row.created_at,
            daemon: sanitiseDaemon(await DATABASE.getDaemon(row.daemon_id)),
            free: row.free,
            id: `${row.id}`,
            ports,
            locked: row.locked,
            name: row.name,
            runtime: row.runtime,
            segments: row.segments,
            userId: `${row.user_id}`,
            variantId: row.variant_id,
            versionId: row.version_id,
            terminateAt: +row.terminate_at
        }
    }

    async getContainer(containerId: string): Promise<Container> {
        const containerResult = await this.query(`
            SELECT *
            FROM containers
            WHERE
                id = $1
            LIMIT 1
        `,
            containerId
        );
        if (containerResult.rowCount === 0) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' not found`);
        }

        const row = containerResult.rows[0];
        return this.convertRowToContainer(row);
    }

    async getUserContainerPermissions(containerId: string, userId: string): Promise<ContainerPermission[]> {
        const result = await this.query(`
            SELECT permission
            FROM container_permissions
            WHERE
                container_id = $1
                AND user_id = $2
        `,
            containerId,
            userId
        );
        if (result.rowCount === 0) {
            return [];
        }
        const permissions: ContainerPermission[] = [];
        result.rows.forEach(row => permissions.push(row.permission));
        return permissions;
    }

    async hasUserGotContainerPermissions(containerId: string, userId: string, ...permissions: ContainerPermission[]): Promise<boolean> {
        const userPerms = await this.getUserContainerPermissions(containerId, userId);
        if (userPerms.includes(CONTAINER_ALL_PERMISSION)) {
            return true;
        }
        for (const permission of permissions) {
            if (!userPerms.includes(permission)) {
                return false;
            }
        }
        return true;
    }

    private async reserveSegments(client: PostgresClient, reserveMethod: SegmentReserveMethod, regionId: string, segments: number): Promise<{
        id: string,
        portRangeStart?: number,
        portRangeEnd?: number
    }> {
        let result: Promise<QueryResult>;
        switch (reserveMethod) {
            case "fifo":
                result = client.query(`
                    UPDATE daemons
                    SET segments_available = segments_available - $1
                    WHERE id = (
                        SELECT id FROM daemons
                        WHERE
                            region_id = $2
                            AND segments_available >= $1
                        LIMIT 1
                    )
                    RETURNING
                        id,
                        port_range_start,
                        port_range_end
                `,
                    segments,
                    regionId
                );
                break;
            case "balanced":
                result = client.query(`
                    UPDATE daemons
                    SET segments_available = segments_available - $1
                    WHERE id = (
                        SELECT id FROM daemons
                        WHERE
                            region_id = $2
                            AND segments_available >= $1
                        ORDER BY segments_available DESC
                        LIMIT 1
                    )
                    RETURNING
                        id,
                        port_range_start,
                        port_range_end
                `,
                    segments,
                    regionId
                );
            default:
                throw new OGSHError("general/unspecified", `invalid daemon segment reserve method '${reserveMethod}'`);
        }
        if ((await result).rowCount === 0) {
            throw new OGSHError("general/unspecified", `no availability left in region '${regionId}'`);
        }
        const row = (await result).rows[0];
        return {
            id: row.id,
            portRangeStart: row.port_range_start,
            portRangeEnd: row.port_range_end
        }
    }

    async createContainer(data: CreateContainerData): Promise<Container> {
        const version = await getVersion(data.appId, data.variantId, data.versionId);
        const client = await this.startTransaction();
        const assignedDaemon = await this.reserveSegments(client, segmentReserveMethod, data.regionId, data.segments);
        const createContainerResult = await client.query(`
            INSERT INTO containers (
                app_id,
                variant_id,
                version_id,
                contract_length_days,
                name,
                runtime,
                segments,
                user_id,
                daemon_id
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING id
        `,
            data.appId, // 1
            data.variantId, // 2
            data.versionId, // 3
            30, // 4
            data.name, // 5
            version!.defaultRuntime, // 6
            data.segments, // 7
            data.userId, // 8
            assignedDaemon.id // 9
        );
        if (createContainerResult.rowCount === 0) {
            await client.cancel();
            throw new OGSHError("general/unspecified", `could not create container`);
        }
        const containerId = `${createContainerResult.rows[0].id}`;
        const addPermissionsResult = await client.query(`
            INSERT INTO container_permissions (
                container_id,
                user_id,
                permission
            )
            VALUES (
                $1, $2, $3
            )
        `,
            containerId, data.userId, CONTAINER_ALL_PERMISSION
        );
        if (addPermissionsResult.rowCount === 0) {
            await client.cancel();
            throw new OGSHError("general/unspecified", `failed to give permission '${CONTAINER_ALL_PERMISSION}' to user id '${data.userId}' when creating container id '${containerId}'`);
        }

        if (assignedDaemon.portRangeStart && assignedDaemon.portRangeEnd) {
            const variant = await getVariant(data.appId, data.variantId);
            if (!variant) {
                await client.cancel();
                throw new OGSHError("app/variant-not-found", `cannot create container with app id '${data.appId}' variant id '${data.variantId}'`);
            }
            for (const containerPort of Object.keys(variant.ports)) {
                const assignPortsResult = await client.query(`
                    DO $$
                    DECLARE
                        rec RECORD;
                    BEGIN
                        FOR rec IN
                            SELECT ip_id FROM daemon_ips WHERE daemon_id = '${assignedDaemon.id}'
                        LOOP
                            INSERT INTO container_ports (
                                ip_id,
                                container_id,
                                container_port,
                                host_port
                            )
                            VALUES (
                                rec.ip_id,
                                '${containerId}',
                                '${containerPort}',
                                (
                                    SELECT port
                                    FROM generate_series(${assignedDaemon.portRangeStart}, ${assignedDaemon.portRangeEnd}) AS port
                                    WHERE port NOT IN (
                                        SELECT host_port
                                        FROM container_ports
                                    WHERE
                                        ip_id = rec.ip_id
                                    )
                                    ORDER BY random()
                                    LIMIT 1
                                )
                            );
                        END LOOP;
                    END;
                    $$;
                `);
                if (assignPortsResult.rowCount === 0) {
                    await client.cancel();
                    throw new OGSHError("general/unspecified", `failed to assign unique ports, range start '${assignedDaemon.portRangeStart}' range end '${assignedDaemon.portRangeEnd}'`);
                }
            }
        }
        await client.finish();
        return this.getContainer(containerId);
    }

    async terminateContainer(containerId: string, terminateAt: Date) {
        if (terminateAt.getTime() < Date.now()) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' termination date must be in the future`);
        }
        const result = await this.query(`
            UPDATE containers
            SET terminate_at = $1
            WHERE
                id = $2
                AND terminate_at IS NULL
            LIMIT 1
        `,
            +terminateAt,
            containerId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' either doesn't exist or already has a termination date`);
        }
    }

    async cancelTerminateContainer(containerId: string) {
        const result = await this.query(`
            UPDATE containers
            SET terminate_at = NULL
            WHERE
                id = $1
                AND (terminate_at IS NOT NULL AND terminate_at >= NOW())
        `,
            containerId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' either had no termination date or it's in the past`);
        }
    }

    async listActiveContainersByUser(authUid: string, page: number = 0, resultsPerPage: number = 10): Promise<Container[]> {
        const result = await this.query(`
            SELECT c.*
            FROM containers c
            JOIN users u ON u.id = c.user_id
            WHERE
                u.auth_uid = $1
                AND (terminate_at IS NULL OR terminate_at <= NOW())
            LIMIT $2
            OFFSET $3
        `,
            authUid,
            resultsPerPage,
            page * resultsPerPage
        );
        const containers: Container[] = [];
        for (const row of result.rows) {
            containers.push(await this.convertRowToContainer(row));
        }
        return containers;
    }

    async listActiveContainersByDaemon(daemonId: string, page: number = 0, resultsPerPage: number = 10): Promise<Container[]> {
        const result = await this.query(`
            SELECT c.*
            FROM containers c
            JOIN daemons d ON d.id = c.daemon_id
            WHERE
                c.daemon_id = $1
                AND (terminate_at IS NULL OR terminate_at <= NOW())
            LIMIT $2
            OFFSET $3
        `,
            daemonId,
            resultsPerPage,
            page * resultsPerPage
        );
        const containers: Container[] = [];
        for (const row of result.rows) {
            containers.push(await this.convertRowToContainer(row));
        }
        return containers;
    }

    async setContainerName(containerId: string, name: string) {
        const result = await this.query(`
            UPDATE containers
            SET name = $1
            WHERE id = $2
        `,
            name,
            containerId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `failed to update container id '${containerId}' name, row not found`);
        }
    }

    async setContainerRuntime(containerId: string, runtime: string) {
        const result = await this.query(`
            UPDATE containers
            SET runtime = $1
            WHERE id = $2
        `,
            containerId,
            runtime
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `failed to set container id '${containerId}' runtime, row not found`);
        }
    }

    async setContainerApp(containerId: string, appId: string, variantId: string, versionId: string) {
        const result = await this.query(`
            UPDATE containers
            SET
                app_id = $1,
                variant_id = $2,
                version_id = $3
            WHERE
                id = $4
        `,
            appId,
            variantId,
            versionId,
            containerId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `failed to change app for container id '${containerId}' to app id '${appId}' variant id '${variantId}' version id '${versionId}'`);
        }
    }
}