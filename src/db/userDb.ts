import { User, UserData } from "../interfaces/user";

export interface UserDb {
    get(uid: string): Promise<User>;
    create(data: UserData): Promise<User>;
    exists(uid: string): Promise<boolean>;
}