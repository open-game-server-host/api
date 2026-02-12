import { Daemon, DaemonData } from "../../interfaces/daemon";
import { DaemonDb } from "../daemonDb";

export class PostgresDaemonDb implements DaemonDb {
    async get(id: string): Promise<Daemon> {
        throw new Error("Method not implemented.");
    }
    
    async create(data: DaemonData): Promise<Daemon> {
        throw new Error("Method not implemented.");
    }
}