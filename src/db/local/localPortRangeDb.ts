import { PortRange, PortRangeData, RawPortRange } from "../../interfaces/portRange";
import { DATABASE } from "../db";
import { PortRangeDb } from "../portRangeDb";
import { LocalDb } from "./localDb";

export class LocalPortRangeDb extends LocalDb implements PortRangeDb {
    constructor() {
        super("localdb/port_ranges");
    }

    async get(id: string): Promise<PortRange> {
        const raw = this.readJsonFile<RawPortRange>(id);
        return {
            id: raw.id,
            ip: await DATABASE.ip.get(raw.ip_id),
            range_end: raw.range_end,
            range_start: raw.range_start
        }
    }

    async create(data: PortRangeData): Promise<PortRange> {
        const id = this.createUniqueId();
        this.writeJsonFile<RawPortRange>(id, {
            id,
            ...data
        });
        return this.get(id);
    }

    async list(ipId: string): Promise<PortRange[]> {
        const portRanges: PortRange[] = [];
        const ip = await DATABASE.ip.get(ipId);
        this.listJsonFiles<RawPortRange>().filter(pr => pr.ip_id === ipId).forEach(raw => {
            portRanges.push({
                id: raw.id,
                ip,
                range_end: raw.range_end,
                range_start: raw.range_start
            });
        });
        return portRanges;
    }
}