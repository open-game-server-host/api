import { OGSHError, User } from "@open-game-server-host/backend-lib";
import { Database } from "../db.js";
import { PostgresDb } from "./postgresDb.js";

export class PostgresUserDb extends PostgresDb implements Partial<Database> {
    async doesUserExist(userId: string): Promise<boolean> {
        return await this.countQuery("SELECT COUNT(1) FROM users WHERE id = $1", userId) === 1;
    }

    async getUser(authUid: string): Promise<User> {
        const result = await this.query("SELECT * FROM users WHERE auth_uid = $1 LIMIT 1", authUid);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `user with authUid '${authUid}' not found`);
        }
        const row = result.rows[0];
        return {
            authUid: row.authuid,
            createdAt: +row.createdat,
            id: `${row.id}`,
            permissions: [] // TODO
        }
    }

    async createUser(authUid: string): Promise<User> {
        console.log(`3 ${authUid}`);
        const result = await this.query("INSERT INTO users (auth_uid) VALUES ($1)", authUid);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `authUid '${authUid}' already exists`);
        }
        return this.getUser(authUid);
    }
}