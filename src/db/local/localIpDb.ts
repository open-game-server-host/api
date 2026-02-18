import { Ip, IpData } from "@open-game-server-host/backend-lib";
import { IpDb } from "../ipDb";
import { LocalDb } from "./localDb";

export class LocalIpDb extends LocalDb implements IpDb {
    constructor() {
        super("ips");
    }

    async get(id: string): Promise<Ip> {
        return this.readJsonFile<Ip>(id);
    }

    async create(data: IpData): Promise<Ip> {
        const id = this.createUniqueId();
        this.writeJsonFile<Ip>(id, {
            id,
            ...data
        });
        return this.get(id);
    }

    async list(): Promise<Ip[]> {
        console.log(`ip list`);
        const ips: Ip[] = [];
        for (const id of this.enumerateJsonFiles()) {
            ips.push(await this.get(id));
        }
        return ips;
    }
}