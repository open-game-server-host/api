import { OGSHError } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";

export interface UserLocals {
    userId: string;
}

export type UserResponse = Response<any, UserLocals>;

export async function userAuthMiddleware(req: Request, res: UserResponse, next: NextFunction) {
    if (!req.headers.authorization) {
        throw new OGSHError("auth/invalid", `'authorization: bearer' header missing`);
    }
    const token = req.headers.authorization.substring(7);
    if (token.length === 0) {
        throw new OGSHError("auth/invalid", `malformed 'authorization: bearer' header`);
    }
    res.locals.userId = token; // TODO authorise user properly, but for now the token is the userId for testing
    next();
}

export async function authenticateUser(input: Request | string): Promise<string> {
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
    return token;
}