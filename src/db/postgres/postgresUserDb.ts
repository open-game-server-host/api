import { User } from "../../interfaces/user";
import { UserDb } from "../userDb";

export class PostgresUserDb implements UserDb {
    get(): Promise<User> {
        throw new Error("Method not implemented.");
    }
    set(firebaseUid: string): Promise<User> {
        throw new Error("Method not implemented.");
    }

}