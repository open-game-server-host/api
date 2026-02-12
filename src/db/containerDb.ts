import { Container, ContainerData } from "../interfaces/container";

export interface ContainerDb {
    get(id: string): Promise<Container>;
    create(data: ContainerData): Promise<Container>;
    listByDaemon(daemonId: string): Promise<Container[]>; // TODO paginate
    listByUser(uid: string): Promise<Container[]>; // TODO paginate
    delete(id: string): Promise<void>;
}