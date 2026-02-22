import { Ip, OGSHError } from "@open-game-server-host/backend-lib";
import { Database } from "../db.js";
import { LocalDb, LocalDbFolder } from "./localDb.js";

abstract class LocalIpDb extends LocalDb {
    constructor(private readonly dbFolder: LocalDbFolder) {
        super();
    }

    protected async getIp(id: string): Promise<Ip> {
        return this.readJsonFile<Ip>(this.dbFolder, id);
    }

    protected async getIpByIp(ip: string): Promise<Ip> {
        for (const json of this.listJsonFiles<Ip>(this.dbFolder)) {
            if (json.data.ip === ip) {
                return json.data;
            }
        }
        throw new OGSHError("general/unspecified", `could not find ${this.dbFolder} '${ip}'`);
    }

    protected async listIps(): Promise<Ip[]> {
        const ips: Ip[] = [];
        for (const id of this.enumerateJsonFiles(this.dbFolder)) {
            ips.push(await this.getIp(id));
        }
        return ips;
    }
}

export class LocalIpv4Db extends LocalIpDb implements Partial<Database> {
    constructor() {
        super("ipv4");
    }
    getIpv4 = this.getIp;
    getIpv4ByIp = this.getIpByIp;
    listIpv4s = this.listIps;
}

export class LocalIpv6Db extends LocalIpDb implements Partial<Database> {
    constructor() {
        super("ipv6");
    }
    getIpv6 = this.getIp;
    getIpv6ByIp = this.getIpByIp;
    listIpv6s = this.listIps;
}