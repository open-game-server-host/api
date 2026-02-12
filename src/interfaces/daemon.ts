import { IP } from "./ip";
import { PortRange } from "./portRange";
import { Region } from "./region";

export interface Daemon {
    cpu_arch: string;
    cpu_name: string;
    created_at: number;
    id: number;
    ip: IP;
    os: string;
    port_range: PortRange;
    region: Region;
    segments: number;
    segments_used: number;
    sftp_port: number;
    url: string;
}

export interface CreateDaemonInfo {
    cpu_arch: string;
    cpu_name: string;
    ip_id: number;
    os: string;
    port_range_id: number;
    region_id: number;
    segments: number;
    sftp_port: number;
    url: string;
}