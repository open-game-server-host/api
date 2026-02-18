import { ContainerAction, ContainerActionType } from "@open-game-server-host/backend-lib";

export interface AuditDb {
    add(containerId: string, action: ContainerActionType, userId: string, data: string): Promise<void>;
    list(containerId: string): Promise<ContainerAction>; // TODO paginate
    listByUser(containerId: string, userId: string): Promise<ContainerAction>; // TODO paginate
}