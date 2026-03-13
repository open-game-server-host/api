import { Ip, OGSHError } from "@open-game-server-host/backend-lib";
import { Database } from "../db.js";
import { PostgresDb } from "./postgresDb.js";

export class PostgresIpDb extends PostgresDb implements Partial<Database> {
    async getIp(ipId: string): Promise<Ip> {
        const result = await this.query(`SELECT * FROM ips WHERE id = $1 LIMIT 1`, ipId);
        if (result.rowCount === 0) {
            throw new OGSHError("ip/not-found", `record for ip id '${ipId}' does not exist in table 'ips'`);
        }
        const row = result.rows[0];
        return {
            id: `${row.id}`,
            ip: row.ip,
            version: row.version
        }
    }

    async getIpByValue(ip: string): Promise<Ip> {
        const result = await this.query(`SELECT * FROM ips WHERE ip = $1 LIMIT 1`, ip);
        if (result.rowCount === 0) {
            throw new OGSHError("ip/not-found", `record for ip '${ip}' does not exist in table 'ips'`);
        }
        const row = result.rows[0];
        return {
            id: `${row.id}`,
            ip: row.ip,
            version: row.version
        }
    }

    async listIps(page: number, resultsPerPage: number): Promise<Ip[]> {
        const result = await this.query(`
            SELECT *
            FROM ips
            LIMIT $1
            OFFSET $2
        `,
            resultsPerPage,
            page * resultsPerPage
        );
        const ips: Ip[] = [];
        result.rows.forEach(row => {
            ips.push({
                id: `${row.id}`,
                ip: row.ip,
                version: row.version
            });
        });
        return ips;
    }
}