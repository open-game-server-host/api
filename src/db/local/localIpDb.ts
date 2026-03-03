import { Ip, OGSHError } from "@open-game-server-host/backend-lib";
import { LocalDb } from "./localDb.js";

export class LocalIpDb extends LocalDb {
    async getIp(ipId: string): Promise<Ip> {
        return this.readJsonFile<Ip>("ip", ipId);
    }

    async getIpByValue(ip: string): Promise<Ip> {
        for (const json of this.listJsonFiles<Ip>("ip")) {
            if (json.data.ip === ip) {
                return json.data;
            }
        }
        throw new OGSHError("general/unspecified", `could not find ip '${ip}'`);
    }

    async listIps(): Promise<Ip[]> {
        const ips: Ip[] = [];
        for (const id of this.enumerateJsonFiles("ip")) {
            ips.push(await this.getIp(id));
        }
        return ips;
    }
}