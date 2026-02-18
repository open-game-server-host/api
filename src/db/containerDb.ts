import { Container, CreateContainerData } from "@open-game-server-host/backend-lib";

export interface ContainerDb {
    get(id: string): Promise<Container>;
    create(data: CreateContainerData): Promise<Container>;
    listByDaemon(daemonId: string): Promise<Container[]>; // TODO paginate
    listByUser(uid: string): Promise<Container[]>; // TODO paginate
    delete(id: string): Promise<void>;
}
