import { App, Variant, Version } from "@open-game-server-host/backend-lib";
import { Daemon } from "./daemon";

export interface Container {
    app: App;
    contract_length_days: number;
    created_at: Date;
    daemon: Daemon;
    free: boolean;
    id: number;
    locked: boolean;
    name: string;
    terminate_at: Date;
    user_id: number;
    variant: Variant;
    version: Version;
}