import { Container } from "../../interfaces/container";
import { User, UserData } from "../../interfaces/user";
import { UserDb } from "../userDb";

export class PostgresUserDb implements UserDb {
    async get(uid: string): Promise<User> {
        throw new Error("Method not implemented.");
    }
    
    async create(data: UserData): Promise<User> {
        throw new Error("Method not implemented.");
    }
    
    async exists(uid: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async getContainers(uid: string): Promise<Container[]> {
        throw new Error("Method not implemented.");
    }
}