import { Ip, IpData } from "@open-game-server-host/backend-lib";

export interface IpDb {
    get(id: string): Promise<Ip>;
    create(info: IpData): Promise<Ip>;
    list(): Promise<Ip[]>; // TODO list by region maybe?

    // TODO merge port range db into here, also need to store container assigned ports

}