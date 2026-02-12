import { IP } from "./ip";

export interface PortRange {
    id: number;
    ip: IP;
    range_start: number;
    range_end: number;
}