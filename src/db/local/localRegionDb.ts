import { Region } from "@open-game-server-host/backend-lib";
import { CreateRegionData } from "../../interfaces/region.js";
import { Database } from "../db.js";
import { LocalDb } from "./localDb.js";

export class LocalRegionDb extends LocalDb implements Partial<Database> {
    async getRegion(id: string): Promise<Region> {
        return this.readJsonFile<Region>("region", id);
    }

    async createRegion(data: CreateRegionData): Promise<Region> {
        const id = this.createUniqueId("region");
        this.writeJsonFile<Region>("region", id, {
            id,
            ...data
        });
        return this.getRegion(id);
    }

    async listRegions(): Promise<Region[]> {
        const regions: Region[] = [];
        for (const id of this.enumerateJsonFiles("region")) {
            regions.push(await this.getRegion(id));
        }
        return regions;
    }
}