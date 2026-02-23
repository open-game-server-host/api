import { OGSHError } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";
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