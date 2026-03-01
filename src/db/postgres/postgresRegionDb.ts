import { OGSHError, Region } from "@open-game-server-host/backend-lib";
import { CreateRegionData } from "../../interfaces/region.js";
import { Database } from "../db.js";
import { PostgresDb } from "./postgresDb.js";

export class PostgresRegionDb extends PostgresDb implements Partial<Database> {
    async getRegion(regionId: string): Promise<Region> {
        const result = await this.query("SELECT * FROM regions WHERE id = $1 LIMIT 1", regionId);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `no row in regions table matching id '${regionId}'`);
        }
        result.oid
        const row = result.rows[0];
        return {
            countryCode: row.country_code,
            id: `${row.id}`,
            name: row.name,
            priceMultiplier: row.pricemultiplier
        }
    }

    async createRegion(data: CreateRegionData): Promise<Region> {
        const result = await this.query(`
            INSERT INTO regions (
                country_code,
                name,
                price_multiplier
            )
            VALUES ($1, $2, $3)
            RETURNING id`,
            data.countryCode,
            data.name,
            data.priceMultiplier);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `failed to create new region`);
        }
        const id = `${result.rows[0].id}`;
        return this.getRegion(id);
    }

    async listRegions(): Promise<Region[]> {
        const result = await this.query("SELECT * FROM regions");
        const regions: Region[] = [];
        result.rows.forEach(row => {
            regions.push({
                countryCode: row.country_code,
                id: `${row.id}`,
                name: row.name,
                priceMultiplier: row.pricemultiplier
            });
        });
        return regions;
    }
}