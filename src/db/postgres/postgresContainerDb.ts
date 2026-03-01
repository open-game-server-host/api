import { Container, OGSHError } from "@open-game-server-host/backend-lib";
import { segmentReserveMethod, SegmentReserveMethod } from "../../daemon/daemon.js";
import { CreateContainerData } from "../../interfaces/container.js";
import { Database } from "../db.js";
import { PostgresDb } from "./postgresDb.js";

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
            JOIN regions r ON d.region_id = r.id
            WHERE
                id=$1
            LIMIT 1`,
            containerId);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' not found`);
        }
        const row = result.rows[0];
        return this.convertRowToContainer(row);
    }

    private getReserveSegmentsQuery(reserveMethod: SegmentReserveMethod, argIndex: number): string {
        switch (reserveMethod) {
            case "fifo":
                return `
                    UPDATE daemons SET segments_available = segments_available - $${++argIndex}
                    WHERE id = (
                        SELECT id FROM daemons
                        WHERE
                            region_id = $${++argIndex}
                            AND segments_available >= $${argIndex - 1}
                        LIMIT 1
                    )
                    RETURNING id`;
            case "balanced":
                return `
                    UPDATE daemons SET segments_available = segments_available - $${++argIndex}
                    WHERE id = (
                        SELECT id FROM daemons
                        WHERE
                            region_id = $${++argIndex}
                            AND segments_available >= $${argIndex - 1}
                        ORDER BY segments_available DESC
                        LIMIT 1
                    )
                    RETURNING id`;
            default:
                throw new OGSHError("general/unspecified", `invalid daemon segment reserve method '${reserveMethod}'`);
        }
    }

    async createContainer(data: CreateContainerData): Promise<Container> {
        let argIndex = 0;
        const result = await this.query(`
            INSERT INTO containers (
                app_id,
                contract_length_days,
                daemon_id,
                free,
                name,
                runtime,
                segments,
                user_id,
                variant_id,
                version_id
            )
            VALUES ($${++argIndex}, $${++argIndex}, (${this.getReserveSegmentsQuery(segmentReserveMethod, argIndex)}), $${++argIndex}, $${++argIndex}, $${++argIndex}, $${++argIndex}, $${++argIndex}, $${++argIndex},${++argIndex})
            RETURNING id`,
            data.appId,
            30, // TODO specified by the plan the user selects during checkout
            data.segments,
            data.regionId,
            false,
            data.name,
            data.runtime,
            data.segments,
            data.userId,
            data.variantId,
            data.versionId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `could not create container`);
        }
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
                JOIN regions r ON d.region_id = r.id
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
                JOIN regions r ON d.region_id = r.id
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