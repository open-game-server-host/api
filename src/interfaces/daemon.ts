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
    port_range_start: number;
    port_range_end: number;
    region_id: string;
    segments: number;
    segments_available: number;
    sftp_port: number;
    url: string;
    ws_url: string;
}