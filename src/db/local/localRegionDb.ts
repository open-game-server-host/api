import { Region, RegionData } from "@open-game-server-host/backend-lib";
import { RegionDb } from "../regionDb";
import { LocalDb } from "./localDb";

export class LocalRegionDb extends LocalDb implements RegionDb {
    constructor() {
        super("regions");
    }

    async get(id: string): Promise<Region> {
        return this.readJsonFile<Region>(id);
    }

    async create(data: RegionData): Promise<Region> {
        const id = this.createUniqueId();
        this.writeJsonFile<Region>(id, {
            id,
            ...data
        });
        return this.get(id);
    }
    
    async list(): Promise<Region[]> {
        const regions: Region[] = [];
        for (const id of this.enumerateJsonFiles()) {
            regions.push(await this.get(id));
        }
        return regions;
    }
}