import { Ip, IpData } from "@open-game-server-host/backend-lib";
import { Database } from "../db";
import { LocalDb } from "./localDb";

export class LocalIpDb extends LocalDb implements Partial<Database> {
    async getIp(id: string): Promise<Ip> {
        return this.readJsonFile<Ip>("ip", id);
    }

    async createIp(data: IpData): Promise<Ip> {
        const id = this.createUniqueId("ip");
        this.writeJsonFile<Ip>("ip", id, {
            id,
            ...data
        });
        return this.getIp(id);
    }

    async listIps(): Promise<Ip[]> {
        const ips: Ip[] = [];
        for (const id of this.enumerateJsonFiles("ip")) {
            ips.push(await this.getIp(id));
        }
        return ips;
    }
}