import { Container, ContainerData } from "../../interfaces/container";
import { ContainerDb } from "../containerDb";
import { PostgresDb } from "./postgresDb";

export class PostgresContainerDb extends PostgresDb implements ContainerDb {
    async get(id: string): Promise<Container> {
        throw new Error("Method not implemented.");
    }

    async create(data: ContainerData): Promise<Container> {
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