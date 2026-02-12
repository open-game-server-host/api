import { User } from "../interfaces/user";

export interface UserDb {
    get(): Promise<User>;
    set(firebaseUid: string): Promise<User>;
}