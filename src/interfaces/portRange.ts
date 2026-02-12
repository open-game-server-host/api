import { Ip } from "./ip";

export interface PortRange {
    id: string;
    ip: Ip;
    range_start: number;
    range_end: number;
}

export interface RawPortRange extends PortRangeData {
    id: string;
}

export interface PortRangeData {
    ip_id: string;
    range_start: number;
    range_end: number;
}