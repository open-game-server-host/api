import { OGSHError, User } from "@open-game-server-host/backend-lib";
import { USER_ALL_PERMISSION, USER_DEFAULT_PERMISSIONS, UserPermission } from "../../interfaces/user.js";
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
        const client = await this.startTransaction();
        const userResult = await client.query("INSERT INTO users (auth_uid) VALUES ($1) RETURNING id", authUid);
        if (userResult.rowCount === 0) {
            await client.cancel();
            throw new OGSHError("general/unspecified", `authUid '${authUid}' already exists`);
        }
        const id = userResult.rows[0].id;
        let permissionsInsert = "";
        for (let i = USER_DEFAULT_PERMISSIONS.length; i > 0; i--) {
            permissionsInsert += `('${id}', '${USER_DEFAULT_PERMISSIONS[i]}')`;
            if (i > 0) {
                permissionsInsert += ","
            }
        }
        console.log(`permissions: '${permissionsInsert}'`);
        const permissionResult = await client.query(`
            INSERT INTO user_permissions (user_id, permission) (
                user_id,
                permission
            ) VALUES
                ${permissionsInsert}
        `,
            id
        );
        if (permissionResult.rowCount === 0) {
            await client.cancel();
            throw new OGSHError("general/unspecified", `failed to add auth uid '${authUid}' default permissions`);
        }
        await client.finish();
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