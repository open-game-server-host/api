import { App, Variant, Version } from "@open-game-server-host/backend-lib";
import { Daemon } from "./daemon";

export interface Container {
    app: App;
    contract_length_days: number;
    created_at: number;
    daemon: Daemon;
    free: boolean;
    id: string;
    locked: boolean;
    name: string;
    terminate_at: number;
    user_id: string;
    variant: Variant;
    version: Version;
}

export interface RawContainer extends ContainerData {
    id: string;
}

export interface ContainerData {
    app_id: string;
    contract_length_days: number;
    created_at: number;
    daemon_id: string;
    free: boolean;
    locked: boolean;
    name: string;
    terminate_at: number;
    user_id: string;
    variant_id: string;
    version_id: string;
}