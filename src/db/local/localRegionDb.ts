import { Region } from "@open-game-server-host/backend-lib";
import { CreateRegionData } from "../../interfaces/region.js";
import { Database } from "../db.js";
import { LocalDb } from "./localDb.js";

export class LocalRegionDb extends LocalDb implements Partial<Database> {
    async getRegion(regionId: string): Promise<Region> {
        return this.readJsonFile<Region>("region", regionId);
    }

    async createRegion(data: CreateRegionData): Promise<Region> {
        const id = this.createUniqueId("region");
        this.writeJsonFile<Region>("region", id, {
            id,
            ...data
        });
        return this.getRegion(id);
    }

    async listRegions(page: number = 0, resultsPerPage: number = 10): Promise<Region[]> {
        let index = 0;
        const regions: Region[] = [];
        for (const id of this.enumerateJsonFiles("region")) {
            if (index >= page * resultsPerPage) {
                regions.push(await this.getRegion(id));
            }
            index++;
        }
        return regions;
    }
}