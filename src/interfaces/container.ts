export interface CreateContainerData {
    appId: string;
    variantId: string;
    versionId: string;
    free: boolean;
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
;