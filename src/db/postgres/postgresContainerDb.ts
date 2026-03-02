import { Container, getVersion, OGSHError } from "@open-game-server-host/backend-lib";
import { QueryResult } from "pg";
import { segmentReserveMethod, SegmentReserveMethod } from "../../daemon/daemon.js";
import { CreateContainerData } from "../../interfaces/container.js";
import { Database } from "../db.js";
import { PostgresClient, PostgresDb, PostgresTransaction } from "./postgresDb.js";

export class PostgresContainerDb extends PostgresDb implements Partial<Database> {
    private convertRowToContainer(row: any): Container {
        return {
            appId: row.app_id,
            contractLengthDays: row.contract_length_days,
            createdAt: +row.created_at,
            daemon: {
                cpuArch: row.cpu_arch,
                createdAt: +row.daemon_created_at,
                id: `${row.daemon_id}`,
                region: {
                    countryCode: row.country_code,
                    id: `${row.region_id}`,
                    name: row.region_name,
                    priceMultiplier: row.price_multiplier
                },
                ipv4: row.ipv4_id ? {
                    id: `${row.ipv4_id}`,
                    ip: row.ipv4_ip
                } : undefined,
                ipv6: row.ipv6_id ? {
                    id: `${row.ipv6_id}`,
                    ip: row.ipv6_ip
                } : undefined,
                setupComplete: row.setup_complete
            },
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
                d.created_at as daemon_created_at,
                d.cpu_arch,
                d.id as daemon_id,
                d.ipv4_id,
                d.ipv6_id,
                d.region_id,
                v4.ip as ipv4_ip,
                v6.ip as ipv6_ip,
                r.name as region_name,
                r.country_code,
                r.price_multiplier
            FROM containers c
            JOIN daemons d ON c.daemon_id=d.id
            LEFT JOIN ipv4 v4 ON d.ipv4_id = v4.id
            LEFT JOIN ipv6 v6 ON d.ipv6_id = v6.id
            LEFT JOIN regions r ON d.region_id = r.id
            WHERE
                c.id = $1
            LIMIT 1`,
            containerId);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' not found`);
        }
        const row = result.rows[0];
        return this.convertRowToContainer(row);
    }

    private async reserveSegments(client: PostgresClient, reserveMethod: SegmentReserveMethod, regionId: string, segments: number): Promise<string> {
        let result: Promise<QueryResult>;
        switch (reserveMethod) {
            case "fifo":
                result = client.query(`
                    UPDATE daemons SET segments_available = segments_available - $1
                    WHERE id = (
                        SELECT id FROM daemons
                        WHERE
                            region_id = $2
                            AND segments_available >= $1
                        LIMIT 1
                    )
                    RETURNING id`,
                    segments,
                    regionId);
                break;
            case "balanced":
                result = client.query(`
                    UPDATE daemons SET segments_available = segments_available - $1
                    WHERE id = (
                        SELECT id FROM daemons
                        WHERE
                            region_id = $2
                            AND segments_available >= $1
                        ORDER BY segments_available DESC
                        LIMIT 1
                    )
                    RETURNING id`,
                    segments,
                    regionId);
            default:
                throw new OGSHError("general/unspecified", `invalid daemon segment reserve method '${reserveMethod}'`);
        }
        if ((await result).rowCount === 0) {
            throw new OGSHError("general/unspecified", `no availability left in region '${regionId}'`);
        }
        return (await result).rows[0].id;
    }

    async createContainer(data: CreateContainerData): Promise<Container> {
        const version = await getVersion(data.appId, data.variantId, data.versionId);
        if (!version) {
            throw new OGSHError("app/version-not-found", `cannot create container with app id '${data.appId}' variant id '${data.variantId}' version id '${data.versionId}'`);
        }
        const client = await this.startTransaction();
        const daemonId = await this.reserveSegments(client, segmentReserveMethod, data.regionId, data.segments);
        const result = await client.query(`
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
            RETURNING id`,
            data.appId, // 1
            data.variantId, // 2
            data.versionId, // 3
            30, // 4 TODO specified by the plan the user selects during checkout
            data.name, // 5
            version.defaultRuntime, // 6
            data.segments, // 7
            data.userId, // 8
            daemonId // 9
        );
        if (result.rowCount === 0) {
            await client.cancel();
            throw new OGSHError("general/unspecified", `could not create container`);
        }
        await client.finish();
        const id = `${result.rows[0].id}`;
        return this.getContainer(id);
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
            LIMIT 1`, +terminateAt, containerId);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' either doesn't exist or already has a termination date`);
        }
    }

    async listActiveContainersByUser(authUid: string): Promise<Container[]> {
        const result = await this.query(`
            SELECT 
                c.*,
                d.created_at as daemon_created_at,
                d.cpu_arch,
                d.id as daemon_id,
                d.ipv4_id,
                d.ipv6_id,
                d.region_id,
                v4.ip as ipv4_ip,
                v6.ip as ipv6_ip,
                r.name as region_name,
                r.country_code,
                r.price_multiplier
            FROM containers c
                JOIN daemons d ON c.daemon_id=d.id
                LEFT JOIN ipv4 v4 ON d.ipv4_id = v4.id
                LEFT JOIN ipv6 v6 ON d.ipv6_id = v6.id
                LEFT JOIN regions r ON d.region_id = r.id
            WHERE
                auth_uid = $1
                AND terminate_at <= NOW()`,
            authUid);
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
                d.created_at as daemon_created_at,
                d.cpu_arch,
                d.id as daemon_id,
                d.ipv4_id,
                d.ipv6_id,
                d.region_id,
                v4.ip as ipv4_ip,
                v6.ip as ipv6_ip,
                r.name as region_name,
                r.country_code,
                r.price_multiplier
            FROM containers c
                JOIN daemons d ON c.daemon_id=d.id
                LEFT JOIN ipv4 v4 ON d.ipv4_id = v4.id
                LEFT JOIN ipv6 v6 ON d.ipv6_id = v6.id
                LEFT JOIN regions r ON d.region_id = r.id
            WHERE
                daemon_id = $1
                AND terminate_at <= NOW()`,
            daemonId);
        const containers: Container[] = [];
        result.rows.forEach(row => {
            containers.push(this.convertRowToContainer(row));
        });
        return containers;
    }
}