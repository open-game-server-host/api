import { OGSHError, User } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";
import { DATABASE } from "../db/db.js";
import { UserPermission } from "../interfaces/user.js";
import { AUTH, UserAuth } from "./user/auth.js";

export interface UserLocals {
    authUid: string;
    email: string;
}
export type UserResponse = Response<any, UserLocals>;

export async function userAuthMiddleware(req: Request, res: UserResponse, next: NextFunction) {
    res.locals = await authenticateUser(req);
    next();
}

export async function authenticateUser(input: Request | string): Promise<UserAuth> {
    let token: string = input as string;
    if (typeof input !== "string") {
        const authHeader = (input as Request).headers.authorization;
        if (!authHeader) {
            throw new OGSHError("auth/invalid", `'authorization: bearer' header missing`);
        }
        token = authHeader.substring(7);
        if (token.length === 0) {
            throw new OGSHError("auth/invalid", `malformed 'authorization: bearer' header`);
        }
    }
    return await AUTH.validateUser(token);
}

export interface UserPermissionLocals {
    user: User;
}
export type UserPermissionResponse = Response<any, UserPermissionLocals>;

export function userPermissionMiddleware(...permissions: UserPermission[]): (req: Request, res: UserPermissionResponse, next: NextFunction) => Promise<void> {
    return async (req, res, next) => {
        const userAuth = await authenticateUser(req);
        res.locals.user = await DATABASE.getUser(userAuth.authUid);
        if (!await DATABASE.hasUserGotPermissions(res.locals.user.id, permissions)) {
            throw new OGSHError("auth/invalid", `user id '${res.locals.user.id}' does not have permissions '${permissions}'`);
        }
        next();
    };
}