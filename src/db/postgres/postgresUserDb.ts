import { OGSHError, User } from "@open-game-server-host/backend-lib";
import { USER_ALL_PERMISSION, UserPermission } from "../../interfaces/user.js";
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
            authUid: row.auth_uid,
            createdAt: +row.created_at,
            id: `${row.id}`
        }
    }

    async createUser(authUid: string): Promise<User> {
        const result = await this.query("INSERT INTO users (auth_uid) VALUES ($1)", authUid);
        if (result.rowCount === 0) {
            throw new OGSHError("general/unspecified", `authUid '${authUid}' already exists`);
        }
        return this.getUser(authUid);
    }

    async getUserPermissions(userId: string): Promise<UserPermission[]> {
        const result = await this.query(`
            SELECT permission
            FROM user_permissions
            WHERE
                user_id = $1
        `,
            userId
        );
        const permissions: UserPermission[] = [];
        result.rows.forEach(row => permissions.push(row.permission));
        return permissions;
    }

    async hasUserGotPermissions(userId: string, permissions: UserPermission[]): Promise<boolean> {
        console.log(`checking if user ${userId} has permissions '${permissions}'`);
        const userPerms = await this.getUserPermissions(userId);
        if (userPerms.includes(USER_ALL_PERMISSION)) {
            return true;
        }
        for (const permission of permissions) {
            if (!userPerms.includes(permission)) {
                return false;
            }
        }
        return true;
    }
}