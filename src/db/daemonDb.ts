import { Daemon, DaemonData } from "@open-game-server-host/backend-lib";
import { SegmentReserveMethod } from "../daemon/daemon";

export interface DaemonDb {
    get(id: string): Promise<Daemon>;
    create(data: DaemonData): Promise<Daemon>;
    reserveSegments(regionId: string, reserveMethod: SegmentReserveMethod, segments: number): Promise<string>; // Returns daemon ID
    list(): Promise<Daemon[]>; // TODO paginate
    listByRegion(regionId: string): Promise<Daemon[]>; // TODO paginate
    // TODO update options e.g. region, segments, runtime, app/variant/version
}