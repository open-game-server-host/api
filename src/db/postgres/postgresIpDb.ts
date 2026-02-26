import { Ip, OGSHError } from "@open-game-server-host/backend-lib";
import { Database } from "../db.js";
import { PostgresDb } from "./postgresDb.js";

type IpTable =
    | "ipv4"
    | "ipv6"
;

abstract class PostgresIpDb extends PostgresDb {
    constructor(private readonly ipTable: IpTable) {
        super();
    }

    protected async getIp(id: string): Promise<Ip> {
        const result = await this.query(`SELECT * FROM ${this.ipTable} WHERE id = $1 LIMIT 1`, id);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `record for ip id '${id}' does not exist in table '${this.ipTable}'`);
        }
        const row = result.rows[0];
        return {
            id: `${row.id}`,
            ip: row.ip
        }
    }

    protected async getIpByIp(ip: string): Promise<Ip> {
        const result = await this.query(`SELECT * FROM ${this.ipTable} WHERE ip = $1 LIMIT 1`, ip);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `record for ip '${ip}' does not exist in table '${this.ipTable}'`);
        }
        const row = result.rows[0];
        return {
            id: `${row.id}`,
            ip: row.ip
        }
    }

    protected async listIps(): Promise<Ip[]> {
        const result = await this.query(`SELECT * FROM ${this.ipTable}`);
        const ips: Ip[] = [];
        result.rows.forEach(row => {
            ips.push({
                id: `${row.id}`,
                ip: row.ip
            });
        });
        return ips;
    }
}

export class PostgresIpv4Db extends PostgresIpDb implements Partial<Database> {
    constructor() {
        super("ipv4");
    }
    getIpv4 = this.getIp;
    getIpv4ByIp = this.getIpByIp;
    listIpv4s = this.listIps;
}

export class PostgresIpv6Db extends PostgresIpDb implements Partial<Database> {
    constructor() {
        super("ipv6");
    }
    getIpv6 = this.getIp;
    getIpv6ByIp = this.getIpByIp;
    listIpv6s = this.listIps;
}