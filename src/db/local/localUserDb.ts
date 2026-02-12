import { User, UserData } from "../../interfaces/user";
import { UserDb } from "../userDb";
import { LocalDb } from "./localDb";

export class LocalUserDb extends LocalDb implements UserDb {
    constructor() {
        super("localdb/users");
    }

    async get(uid: string): Promise<User> {
        return this.readJsonFile<User>(uid);
    }

    async create(data: UserData): Promise<User> {
        this.writeJsonFile<User>(data.uid, {
            id: this.createUniqueId(),
            created_at: new Date(),
            uid: data.uid
        });
        return this.get(data.uid);
    }

    async exists(uid: string): Promise<boolean> {
        return this.jsonFileExists(uid);
    }
}