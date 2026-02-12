import { Region, RegionData } from "../../interfaces/region";
import { RegionDb } from "../regionDb";
import { LocalDb } from "./localDb";

export class LocalRegionDb extends LocalDb implements RegionDb {
    constructor() {
        super("localdb/regions");
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
        return this.listJsonFiles<Region>();
    }
}