import { Daemon, DaemonData } from "../interfaces/daemon";

export interface DaemonDb {
    get(id: string): Promise<Daemon>;
    create(data: DaemonData): Promise<Daemon>;
    // TODO update options e.g. region, segments, runtime, app/variant/version
}