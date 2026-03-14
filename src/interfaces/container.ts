import { User } from "@open-game-server-host/backend-lib";

export interface CreateContainerData {
    appId: string;
    variantId: string;
    versionId: string;
    name: string;
    regionId: string;
    segments: number;
    userId: string;
}

export type ContainerPermission =
    | "*"
    | "start"
    | "stop"
    | "kill"
    | "command"
    | "install"
    | "terminate"
    | "setRuntime"
    | "setName"
    | "resize"
    | "changeRegion"
    | "makeBackup"
    | "listen" // Listen to websockets to get stats and console logs
;

export const CONTAINER_ALL_PERMISSION: ContainerPermission = "*";

export interface ContainerAuditLog {
    containerId: string;
    user: User;
    runAt: number;
    action: ContainerAction;
    data?: any;
}

export type ContainerAction =
    | "start"
    | "stop"
    | "restart"
    | "kill"
    | "command"
    | "install"
    | "setRuntime"
    | "setName"
    | "resize"
    | "changeRegion"
    | "makeBackup"
;