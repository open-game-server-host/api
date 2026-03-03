import { Container, Daemon, getVariant, getVersion, OGSHError, sanitiseDaemon } from "@open-game-server-host/backend-lib";
import { QueryResult } from "pg";
import { segmentReserveMethod, SegmentReserveMethod } from "../../daemon/daemon.js";
import { CONTAINER_ALL_PERMISSION, ContainerPermission, CreateContainerData } from "../../interfaces/container.js";
import { Database } from "../db.js";
import { convertPostgresRowToDaemon } from "./postgresDaemonDb.js";
import { PostgresClient, PostgresDb } from "./postgresDb.js";

export class PostgresContainerDb extends PostgresDb implements Partial<Database> {
    private convertRowToContainer(row: any): Container {
        return {
            appId: row.app_id,
            contractLengthDays: row.contract_length_days,
            createdAt: +row.created_at,
            daemon: sanitiseDaemon(convertPostgresRowToDaemon(row)),
            free: row.free,
            id: `${row.id}`,
            ports: [], // TODO
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
        const result = await this.query(`
            SELECT
                c.*,
                d.*,
                r.name as region_name,
                r.country_code,
                r.price_multiplier,
                array_agg(array[ips.id::text, ips.ip::text, ips.version::text]) as ips
            FROM containers c
            JOIN daemons d ON d.id = c.daemon_id
            LEFT JOIN regions r ON d.region_id = r.id
            LEFT JOIN daemon_ips ON daemon_ips.daemon_id = d.id
            LEFT JOIN ips ON ips.id = daemon_ips.id
            WHERE
                c.id = $1
            GROUP BY c.id, d.id, r.id
            LIMIT 1
        `,
            containerId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' not found`);
        }
        const row = result.rows[0];
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

    private async reserveSegments(client: PostgresClient, reserveMethod: SegmentReserveMethod, regionId: string, segments: number): Promise<Daemon> {
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
                    RETURNING *
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
                    RETURNING *
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
        return convertPostgresRowToDaemon((await result).rows[0]);
    }

    async createContainer(data: CreateContainerData): Promise<Container> {
        const version = await getVersion(data.appId, data.variantId, data.versionId);
        if (!version) {
            throw new OGSHError("app/version-not-found", `cannot create container with app id '${data.appId}' variant id '${data.variantId}' version id '${data.versionId}'`);
        }
        const client = await this.startTransaction();
        const daemon = await this.reserveSegments(client, segmentReserveMethod, data.regionId, data.segments);
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
            30, // 4 TODO specified by the plan the user selects during checkout
            data.name, // 5
            version.defaultRuntime, // 6
            data.segments, // 7
            data.userId, // 8
            daemon.id // 9
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

        if (daemon.portRangeStart && daemon.portRangeEnd) {
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
                            SELECT ip_id FROM daemon_ips WHERE daemon_id = '${daemon.id}'
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
                                    FROM generate_series(${daemon.portRangeStart}, ${daemon.portRangeEnd}) AS port
                                    WHERE port NOT IN (
                                        SELECT host_port
                                        FROM container_ports
                                        WHERE
                                            container_id = '${containerId}'
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
                    throw new OGSHError("general/unspecified", `failed to assign unique ports, range start '${daemon.portRangeStart}' range end '${daemon.portRangeEnd}'`);
                }
            }
        }
        await client.finish();
        return this.getContainer(containerId);
    }

    async terminateContainer(containerId: string, terminateAt: Date): Promise<void> {
        const result = await this.query(`
            UPDATE containers
            SET terminate_at = $1
            WHERE
                id = (
                    SELECT id
                    FROM containers
                    WHERE id = $2
                    LIMIT 1
                )
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

    async listActiveContainersByUser(authUid: string): Promise<Container[]> {
        const result = await this.query(`
            SELECT
                c.*,
                d.*,
                r.name as region_name,
                r.country_code,
                r.price_multiplier,
                array_agg(array[ips.id::text, ips.ip::text, ips.version::text]) as ips
            FROM containers c
            JOIN daemons d ON d.id = c.daemon_id
            LEFT JOIN regions r ON d.region_id = r.id
            LEFT JOIN daemon_ips ON daemon_ips.daemon_id = d.id
            LEFT JOIN ips ON ips.id = daemon_ips.id
            WHERE
                auth_uid = $1
                AND terminate_at <= NOW()
            GROUP BY c.id, d.id, r.id
        `,
            authUid
        );
        const containers: Container[] = [];
        result.rows.forEach(row => {
            containers.push(this.convertRowToContainer(row));
        });
        return containers;
    }

    async listActiveContainersByDaemon(daemonId: string): Promise<Container[]> {
        const result = await this.query(`
            SELECT
                c.*,
                d.*,
                r.name as region_name,
                r.country_code,
                r.price_multiplier,
                array_agg(array[ips.id::text, ips.ip::text, ips.version::text]) as ips
            FROM containers c
            JOIN daemons d ON d.id = c.daemon_id
            LEFT JOIN regions r ON d.region_id = r.id
            LEFT JOIN daemon_ips ON daemon_ips.daemon_id = d.id
            LEFT JOIN ips ON ips.id = daemon_ips.id
            WHERE
                c.daemon_id = $1
                AND (terminate_at IS NULL OR terminate_at <= NOW())
            GROUP BY c.id, d.id, r.id
        `,
            daemonId
        );
        const containers: Container[] = [];
        result.rows.forEach(row => {
            containers.push(this.convertRowToContainer(row));
        });
        return containers;
    }
}