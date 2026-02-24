import { OGSHError, User, UserPermission } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";
import { DATABASE } from "../db/db.js";
import { AUTH, AuthUid } from "./user/auth.js";

export interface UserLocals {
    authUid: AuthUid;
}
export type UserResponse = Response<any, UserLocals>;

export async function userAuthMiddleware(req: Request, res: UserResponse, next: NextFunction) {
    res.locals.authUid = await authenticateUser(req);
    next();
}

export async function authenticateUser(input: Request | string): Promise<AuthUid> {
    let token: string = input as string;
    if (input instanceof Request) {
        const authHeader = input.headers.get("authorization");
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

export function userPermissionMiddleware(permissions: UserPermission[] = []): (req: Request, res: UserPermissionResponse, next: NextFunction) => Promise<void> {
    return async (req, res, next) => {
        const authUid = await authenticateUser(req);
        res.locals.user = await DATABASE.getUser(authUid);
        for (const permission of permissions) {
            if (!res.locals.user.permissions.includes(permission)) {
                throw new OGSHError("auth/invalid", `user id '${res.locals.user.id}' does not have permission '${permission}'`);
            }
        }
        next();
    };
}