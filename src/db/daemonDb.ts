import { Container } from "../interfaces/container";
import { CreateDaemonInfo, Daemon } from "../interfaces/daemon";

export interface DaemonDb {
    get(): Promise<Daemon>;
    set(info: CreateDaemonInfo): Promise<Daemon>;
    getContainers(): Promise<Container[]>
    addContainer(container: Container): Promise<void>;
    // TODO update options e.g. region, segments, runtime, app/variant/version
}