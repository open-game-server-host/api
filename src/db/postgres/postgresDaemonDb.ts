import { Daemon, DaemonData } from "@open-game-server-host/backend-lib";
import { SegmentReserveMethod } from "../../daemon/daemon";
import { DaemonDb } from "../daemonDb";

export class PostgresDaemonDb implements DaemonDb {
    async get(id: string): Promise<Daemon> {
        throw new Error("Method not implemented.");
    }
    
    async create(data: DaemonData): Promise<Daemon> {
        throw new Error("Method not implemented.");
    }

    async reserveSegments(region: string, reserveMethod: SegmentReserveMethod, segments: number): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async list(): Promise<Daemon[]> {
        throw new Error("Method not implemented.");
    }

    async listByRegion(region: string): Promise<Daemon[]> {
        throw new Error("Method not implemented.");
    }
}