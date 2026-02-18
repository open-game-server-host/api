import { Region, RegionData } from "@open-game-server-host/backend-lib";
import { RegionDb } from "../regionDb";

export class PostgresRegionDb implements RegionDb {
    async get(id: string): Promise<Region> {
        throw new Error("Method not implemented.");
    }
    
    async create(data: RegionData): Promise<Region> {
        throw new Error("Method not implemented.");
    }

    async list(): Promise<Region[]> {
        throw new Error("Method not implemented.");
    }
}