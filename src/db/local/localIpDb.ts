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
        throw new OGSHError("ip/not-found", `could not find ip '${ip}'`);
    }

    async listIps(page: number = 0, resultsPerPage: number = 10): Promise<Ip[]> {
        let index = 0;
        const ips: Ip[] = [];
        for (const id of this.enumerateJsonFiles("ip")) {
            if (index >= page * resultsPerPage) {
                ips.push(await this.getIp(id));
            }
            index++;
        }
        return ips;
    }
}