export interface CreateDaemonData {
    api_key_hash: string;
    created_at: number;
}

export interface SetupIncompleteDaemon {
    created_at: number;
    id: string;
    setup_complete: boolean;
}

export interface SetupDaemonData {
    cpu_arch: string;
    cpu_name: string;
    ip_id: string;
    os: string;
    ipv4_port_range_start?: number;
    ipv4_port_range_end?: number;
    ipv6_port_range_start?: number;
    ipv6_port_range_end?: number;
    region_id: string;
    segments: number;
    sftp_port: number;
    ipv4?: string;
    ipv6?: string;
}