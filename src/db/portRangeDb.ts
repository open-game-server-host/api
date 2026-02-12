import { PortRange, PortRangeData } from "../interfaces/portRange";

export interface PortRangeDb {
    get(id: string): Promise<PortRange>;
    create(data: PortRangeData): Promise<PortRange>;
    list(ipId: string): Promise<PortRange[]>;
}