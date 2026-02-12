import { PortRange, PortRangeData } from "../../interfaces/portRange";
import { PortRangeDb } from "../portRangeDb";

export class PostgresPortRangeDb implements PortRangeDb {
    async get(id: string): Promise<PortRange> {
        throw new Error("Method not implemented.");
    }
    
    async create(data: PortRangeData): Promise<PortRange> {
        throw new Error("Method not implemented.");
    }

    async list(ipId: string): Promise<PortRange[]> {
        throw new Error("Method not implemented.");
    }
}