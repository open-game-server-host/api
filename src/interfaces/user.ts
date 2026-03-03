export type UserPermission =
    | "*"
    
    | "createContainer"

    | "createDaemon"
    | "listDaemons"
    | "removeDaemon"
;

export const USER_ALL_PERMISSION: UserPermission = "*";

export const USER_DEFAULT_PERMISSIONS: UserPermission[] = [
    "createContainer",
    "listDaemons"
];