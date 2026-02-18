import { User, UserData } from "@open-game-server-host/backend-lib";

export interface UserDb {
    get(uid: string): Promise<User>;
    create(data: UserData): Promise<User>;
    exists(uid: string): Promise<boolean>;
}