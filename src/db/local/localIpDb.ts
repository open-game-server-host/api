import { Ip, IpData } from "../../interfaces/ip";
import { IpDb } from "../ipDb";
import { LocalDb } from "./localDb";

export class LocalIpDb extends LocalDb implements IpDb {
    constructor() {
        super("localdb/ips");
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
        throw new Error("Method not implemented.");
    }
}