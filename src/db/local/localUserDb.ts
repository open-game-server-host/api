import { OGSHError, User } from "@open-game-server-host/backend-lib";
import { Database } from "../db.js";
import { LocalDb } from "./localDb.js";

export class LocalUserDb extends LocalDb implements Partial<Database> {
    async doesUserExist(id: string): Promise<boolean> {
        for (const user of this.listJsonFiles<User>("user")) {
            if (user.id === id) {
                return true;
            }
        }
        return false;
    }

    async getUser(authUid: string): Promise<User> {
        return this.readJsonFile<User>("user", authUid);
    }

    async createUser(authUid: string): Promise<User> {
        if (this.jsonFileExists("user", authUid)) {
            throw new OGSHError("general/unspecified", `tried to create user auth_id '${authUid}' but they already exist`);
        }

        const id = this.createUniqueId("user");
        this.writeJsonFile<User>("user", authUid, {
            created_at: Date.now(),
            id,
            auth_uid: authUid,
            permissions: []
        });
        return this.getUser(authUid);
    }
}