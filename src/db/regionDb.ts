import { Region, RegionData } from "../interfaces/region";

export interface RegionDb {
    get(id: string): Promise<Region>;
    create(data: RegionData): Promise<Region>;
    list(): Promise<Region[]>;
}