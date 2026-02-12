import { Ip, IpData } from "../interfaces/ip";

export interface IpDb {
    get(id: string): Promise<Ip>;
    create(info: IpData): Promise<Ip>;
    list(): Promise<Ip[]>; // TODO list by region maybe?
}