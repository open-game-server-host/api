import { Container, OGSHError, User } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";
import { DATABASE } from "../db/db.js";
import { CONTAINER_ALL_PERMISSION, ContainerPermission } from "../interfaces/container.js";
import { authenticateUser } from "./userAuth.js";

export interface ContainerLocals {
    container: Container;
    permissions: ContainerPermission[];
    user: User;
}

export type ContainerResponse = Response<any, ContainerLocals>;

export function containerAuthMiddleware(permissions: ContainerPermission[] = []): (req: Request, res: ContainerResponse, next: NextFunction) => Promise<void> {
    return async (req, res, next) => {
        const containerId = req.params.containerId;
        if (typeof containerId !== "string") {
            throw new OGSHError("container/not-found", `request parameter 'containerId' was not a string`);
        }

        const authUid = await authenticateUser(req);
        res.locals.user = await DATABASE.getUser(authUid);
        res.locals.permissions = await DATABASE.getUserContainerPermissions(containerId, res.locals.user.id);

        for (const permission of permissions) {
            if (!res.locals.permissions.includes(CONTAINER_ALL_PERMISSION) && !res.locals.permissions.includes(permission)) {
                throw new OGSHError("auth/invalid", `user id '${res.locals.user.id} does not have permission '${permission}' for container id '${containerId}'`);
            }
        }

        res.locals.container = await DATABASE.getContainer(containerId);

        next();
    }
}