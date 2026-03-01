import { Daemon, OGSHError, UpdateDaemonData } from "@open-game-server-host/backend-lib";
import { generateDaemonApiKey } from "../../daemon/daemon.js";
import { SetupDaemonData, SetupIncompleteDaemon } from "../../interfaces/daemon.js";
import { Database } from "../db.js";
import { PostgresDb } from "./postgresDb.js";

export class PostgresDaemonDb extends PostgresDb implements Partial<Database> {
    private convertRowToDaemon(row: any): Daemon {
        return {
            apiKeyHash: row.api_key_hash,
            cpuArch: row.cpu_arch,
            cpuName: row.cpu_name,
            createdAt: +row.created_at,
            id: `${row.id}`,
            os: row.os,
            region: {
                countryCode: row.country_code,
                id: `${row.region_id}`,
                name: row.region_name,
                priceMultiplier: row.price_multiplier
            },
            segments: row.segments,
            segmentsAvailable: row.segments_available,
            setupComplete: row.setup_complete,
            ipv4: row.ipv4_id ? {
                id: `${row.ipv4_id}`,
                ip: row.ipv4_ip
            } : undefined,
            ipv6: row.ipv6_id ? {
                id: `${row.ipv6_id}`,
                ip: row.ipv6_ip
            } : undefined,
            portRangeEnd: row.port_range_end,
            portRangeStart: row.port_range_start,
            segmentsMax: row.segmentsMax
        }
    }

    async getDaemon(daemonId: string): Promise<Daemon> {
        const result = await this.query(`
            SELECT 
                d.*,
                v4.ip as ipv4_ip,
                v6.ip as ipv6_ip,
                r.name as region_name,
                r.country_code,
                r.price_multiplier
            FROM daemons d
            LEFT JOIN ipv4 v4 ON d.ipv4_id = v4.id
            LEFT JOIN ipv6 v6 ON d.ipv6_id = v6.id
            JOIN regions r ON d.region_id = r.id
            WHERE
                d.id = $1
            LIMIT 1`,
            daemonId);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `daemon id '${daemonId}' not found`);
        }
        const row = result.rows[0];
        return this.convertRowToDaemon(row);
    }

    async getDaemonByApiKeyHash(apiKeyHash: string): Promise<Daemon | SetupIncompleteDaemon> {
        const result = await this.query(`
            SELECT 
                d.*,
                v4.ip as ipv4_ip,
                v6.ip as ipv6_ip,
                r.name as region_name,
                r.country_code,
                r.price_multiplier
            FROM daemons d
            LEFT JOIN ipv4 v4 ON d.ipv4_id = v4.id
            LEFT JOIN ipv6 v6 ON d.ipv6_id = v6.id
            JOIN regions r ON d.region_id = r.id
            WHERE
                d.api_key_hash = $1
            LIMIT 1`,
            apiKeyHash);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `daemon not found by hash`);
        }
        const row = result.rows[0];
        return this.convertRowToDaemon(row);
    }

    async createDaemon(): Promise<string> {
        const key = generateDaemonApiKey();
        const result = await this.query(`
            INSERT INTO daemons (
                api_key_hash
            )
            VALUES (
                $1
            )`,
            key.hash);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `failed to create daemon record`);
        }
        return key.apiKey;
    }

    async updateDaemon(daemonId: string, data: UpdateDaemonData) {
        const result = await this.query(`
            UPDATE daemons
            SET
                cpu_arch = COALESCE($1, cpu_arch),
                cpu_name = COALESCE($2, cpu_name),
                os = COALESCE($3, os),
                segments_max = COALESCE($4, segments_max)
            WHERE
                id = $5
            `,
            data.cpuArch,
            data.cpuName,
            data.os,
            data.segmentsMax,
            daemonId
        );
    }

    async setupDaemon(daemonId: string, data: SetupDaemonData) {
        const result = await this.query(`
            UPDATE daemons
            SET
                port_range_start = $1,
                port_range_end = $2,
                region_id = $3,
                segments_max = $4
                setup_complete = TRUE
            WHERE
                id = $5
                AND setup_complete = FALSE`,
            data.portRangeStart,
            data.portRangeEnd,
            data.regionId,
            data.segmentsMax,
            daemonId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `could not set up daemon id '${daemonId}', it is either missing or already set up`);
        }
    }

    async listDaemonsByRegion(regionId: string): Promise<Daemon[]> {
        const result = await this.query(`
            SELECT 
                d.*,
                v4.ip as ipv4_ip,
                v6.ip as ipv6_ip,
                r.name as region_name,
                r.country_code,
                r.price_multiplier
            FROM daemons d
            LEFT JOIN ipv4 v4 ON d.ipv4_id = v4.id
            LEFT JOIN ipv6 v6 ON d.ipv6_id = v6.id
            JOIN regions r ON d.region_id = r.id
            WHERE
                d.region_id = $1
            LIMIT 1`,
            regionId);
        const daemons: Daemon[] = [];
        result.rows.forEach(row => {
            daemons.push(this.convertRowToDaemon(row));
        });
        return daemons;
    }

    async listSetupIncompleteDaemons(): Promise<SetupIncompleteDaemon[]> {
        const result = await this.query(`
            SELECT 
                d.*,
                v4.ip as ipv4_ip,
                v6.ip as ipv6_ip,
                r.name as region_name,
                r.country_code,
                r.price_multiplier
            FROM daemons d
            LEFT JOIN ipv4 v4 ON d.ipv4_id = v4.id
            LEFT JOIN ipv6 v6 ON d.ipv6_id = v6.id
            JOIN regions r ON d.region_id = r.id
            WHERE
                d.setup_complete = FALSE
            LIMIT 1`);
        const daemons: Daemon[] = [];
        result.rows.forEach(row => {
            daemons.push(this.convertRowToDaemon(row));
        });
        return daemons;
    }
}