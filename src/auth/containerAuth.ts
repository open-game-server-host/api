import { OGSHError, User } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";
import { DATABASE } from "../db/db.js";
import { authenticateUser } from "./userAuth.js";

export interface ContainerLocals {
    containerId: string;
    user: User;
}

export type ContainerResponse = Response<any, ContainerLocals>;

export async function containerAuthMiddleware(req: Request, res: ContainerResponse, next: NextFunction) {
    const containerId = req.params.containerId;
    if (typeof containerId !== "string") {
        throw new OGSHError("container/not-found", `request parameter 'containerId' was not a string`);
    }
    res.locals.containerId = containerId;

    const authUid = await authenticateUser(req);

    // TODO check if user has permission to access this container

    res.locals.user = await DATABASE.getUser(authUid);
    next();
}