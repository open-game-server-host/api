import { Daemon, OGSHError } from "@open-game-server-host/backend-lib";
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
                "iso3166-1-a-3-code": row.country_code,
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
            ipv4PortRangeEnd: row.ipv4_port_range_end,
            ipv4PortRangeStart: row.ipv4_port_range_start,
            ipv6PortRangeEnd: row.ipv6_port_range_end,
            ipv6PortRangeStart: row.ipv6_port_range_start
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
            JOIN regions r ON d.regionid = r.id
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

    async createDaemon(): Promise<SetupIncompleteDaemon & { apiKey: string; }> {
        const apiKey = generateDaemonApiKey();
        const result = await this.query(`
            INSERT INTO daemons (
                api_key_hash
            )
            VALUES (
                $1
            )
            RETURNING id`,
            apiKey.hash);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `failed to create daemon record`);
        }
        const id = `${result.rows[0].id}`;
        return {
            ...await this.getDaemon(id),
            apiKey: apiKey.apiKey
        }
    }

    async setupDaemon(daemonId: string, data: SetupDaemonData): Promise<Daemon> {
        const result = await this.query(`
            UPDATE daemons
            SET
                cpu_arch=$1,
                cpu_name=$2,
                ipv4_id=$3,
                ipv6_id=$4,
                ipv4_port_range_start=$5,
                ipv4_port_range_end=$6,
                ipv6_port_range_start=$7,
                ipv6_port_range_end=$8,
                os=$9,
                region_id=$10,
                segments=$11,
                segments_available=$11,
                setup_complete=TRUE
            WHERE
                id = $12
                AND setup_complete = FALSE
            LIMIT 1
            RETURNING id`,
            data.cpuArch,
            data.cpuName,
            data.ipv4,
            data.ipv6,
            data.ipv4PortRangeStart,
            data.ipv4PortRangeEnd,
            data.ipv6PortRangeStart,
            data.ipv6PortRangeEnd,
            data.os,
            data.regionId,
            data.segments,
            daemonId
        );
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `could not set up daemon id '${daemonId}', it is either missing or already set up`);
        }
        const id = `${result.rows[0].id}`;
        return this.getDaemon(id);
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