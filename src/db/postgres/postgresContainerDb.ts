import { Container, CreateContainerData } from "@open-game-server-host/backend-lib";
import { ContainerDb } from "../containerDb";
import { PostgresDb } from "./postgresDb";

export class PostgresContainerDb extends PostgresDb implements ContainerDb {
    async get(id: string): Promise<Container> {
        throw new Error("Method not implemented.");
    }

    async create(data: CreateContainerData): Promise<Container> {
        throw new Error("Method not implemented.");
    }

    async listByDaemon(daemonId: string): Promise<Container[]> {
        throw new Error("Method not implemented.");
    }
    
    async listByUser(uid: string): Promise<Container[]> {
        throw new Error("Method not implemented.");
    }

    async delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}