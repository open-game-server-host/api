export interface CreateDaemonData {
    apiKeyHash: string;
    createdAt: number;
}

export interface SetupIncompleteDaemon {
    apiKeyHash: string;
    createdAt: number;
    id: string;
    setupComplete: boolean;
}

export interface SetupDaemonData {
    regionId: string;
    segments: number;
    portRangeStart: number;
    portRangeEnd: number;
}