import { Container } from "../../interfaces/container";
import { CreateDaemonInfo, Daemon } from "../../interfaces/daemon";
import { DaemonDb } from "../daemonDb";

export class PostgresDaemonDb implements DaemonDb {
    get(): Promise<Daemon> {
        throw new Error("Method not implemented.");
    }
    set(info: CreateDaemonInfo): Promise<Daemon> {
        throw new Error("Method not implemented.");
    }
    getContainers(): Promise<Container[]> {
        throw new Error("Method not implemented.");
    }
    addContainer(container: Container): Promise<void> {
        throw new Error("Method not implemented.");
    }

}