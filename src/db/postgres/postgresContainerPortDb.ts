import { AssignedContainerPorts, ContainerPort } from "@open-game-server-host/backend-lib";
import { ContainerPortDb } from "../containerPortDb";
import { PostgresDb } from "./postgresDb";

export class PostgresContainerPortDb extends PostgresDb implements ContainerPortDb {
    async assign(containerId: string, ports: number[]): Promise<ContainerPort[]> {
        throw new Error("Method not implemented.");
    }

    async list(): Promise<AssignedContainerPorts[]> {
        throw new Error("Method not implemented.");
    }
    
    async listByContainer(containerId: string): Promise<AssignedContainerPorts> {
        throw new Error("Method not implemented.");
    }

    async listByDaemon(daemonId: string): Promise<AssignedContainerPorts[]> {
        throw new Error("Method not implemented.");
    }
}