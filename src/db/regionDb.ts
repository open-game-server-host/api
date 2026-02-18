import { Region, RegionData } from "@open-game-server-host/backend-lib";

export interface RegionDb {
    get(id: string): Promise<Region>;
    create(data: RegionData): Promise<Region>;
    list(): Promise<Region[]>;
}