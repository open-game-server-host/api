import { Ip, IpData } from "../../interfaces/ip";
import { IpDb } from "../ipDb";

export class PostgresIpDb implements IpDb {
    async get(id: string): Promise<Ip> {
        throw new Error("Method not implemented.");
    }
    
    async create(info: IpData): Promise<Ip> {
        throw new Error("Method not implemented.");
    }

    async list(): Promise<Ip[]> {
        throw new Error("Method not implemented.");
    }
}