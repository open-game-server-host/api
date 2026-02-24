export interface CreateDaemonData {
    apiKeyHash: string;
    createdAt: number;
}

export interface SetupIncompleteDaemon {
    createdAt: number;
    id: string;
    setupComplete: boolean;
}

export interface SetupDaemonData {
    cpuArch: string;
    cpuName: string;
    ipv4?: string;
    ipv6?: string;
    ipv4PortRangeStart?: number;
    ipv4PortRangeEnd?: number;
    ipv6PortRangeStart?: number;
    ipv6PortRangeEnd?: number;
    os: string;
    regionId: string;
    segments: number;
}

export interface DaemonWsMessage {
    route: string;
    action: string;
    body: any;
}