import { Ip } from "./ip";
import { PortRange } from "./portRange";
import { Region } from "./region";

export interface Daemon {
    cpu_arch: string;
    cpu_name: string;
    created_at: number;
    id: string;
    ip: Ip;
    os: string;
    port_range: PortRange;
    region: Region;
    segments: number;
    segments_used: number;
    sftp_port: number;
    url: string;
}

export interface RawDaemon extends DaemonData {
    id: string;
}

export interface DaemonData {
    cpu_arch: string;
    cpu_name: string;
    created_at: number;
    ip_id: string;
    os: string;
    port_range_id: string;
    region_id: string;
    segments: number;
    segments_used: number;
    sftp_port: number;
    url: string;
}