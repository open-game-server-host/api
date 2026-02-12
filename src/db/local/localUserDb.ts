import { User } from "../../interfaces/user";
import { UserDb } from "../userDb";
import { LocalDb } from "./localDb";

export class LocalUserDb extends LocalDb implements UserDb {
    get(): Promise<User> {
        throw new Error("Method not implemented.");
    }
    set(firebaseUid: string): Promise<User> {
        throw new Error("Method not implemented.");
    }

}