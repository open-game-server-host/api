import { AssignedContainerPorts, ContainerPort } from "@open-game-server-host/backend-lib";

export interface ContainerPortDb {
    assign(daemonId: string, containerPorts: number[]): Promise<ContainerPort[]>;
    list(): Promise<AssignedContainerPorts[]>; // TODO paginate
    listByContainer(containerId: string): Promise<AssignedContainerPorts>;
    listByDaemon(daemonId: string): Promise<AssignedContainerPorts[]>;
}