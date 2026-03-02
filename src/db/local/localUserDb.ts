import { OGSHError, User } from "@open-game-server-host/backend-lib";
import { USER_ALL_PERMISSION, USER_DEFAULT_PERMISSIONS, UserPermission } from "../../interfaces/user.js";
import { Database } from "../db.js";
import { LocalDb } from "./localDb.js";

interface UserLocalDbFile {
    id: string;
    authUid: string;
    createdAt: number;
    permissions: UserPermission[];
}

export class LocalUserDb extends LocalDb implements Partial<Database> {
    async doesUserExist(id: string): Promise<boolean> {
        for (const user of this.listJsonFiles<UserLocalDbFile>("user")) {
            if (user.id === id) {
                return true;
            }
        }
        return false;
    }

    async getUser(authUid: string): Promise<User> {
        const json = this.readJsonFile<UserLocalDbFile>("user", authUid);
        return {
            authUid: json.authUid,
            createdAt: json.createdAt,
            id: json.id
        }
    }

    async createUser(authUid: string): Promise<User> {
        if (this.jsonFileExists("user", authUid)) {
            throw new OGSHError("general/unspecified", `tried to create user authUid '${authUid}' but they already exist`);
        }

        const id = this.createUniqueId("user");
        this.writeJsonFile<UserLocalDbFile>("user", authUid, {
            createdAt: Date.now(),
            id,
            authUid: authUid,
            permissions: USER_DEFAULT_PERMISSIONS
        });
        return this.getUser(authUid);
    }

    async getUserPermissions(userId: string): Promise<UserPermission[]> {
        return this.readJsonFile<UserLocalDbFile>("user", userId).permissions;
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