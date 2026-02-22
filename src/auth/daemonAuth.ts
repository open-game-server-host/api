import { Daemon, OGSHError } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";
import { isDaemonApiKeyValid } from "../daemon/daemon.js";
import { DATABASE } from "../db/db.js";

export interface DaemonLocals {
    daemon: Daemon;
}

export type DaemonResponse = Response<any, DaemonLocals>;

export async function daemonAuthMiddleware(req: Request, res: DaemonResponse, next: NextFunction) {
    const daemonId = req.params.daemonId;
    if (typeof daemonId !== "string") {
        throw new OGSHError("auth/invalid", `request path should contain :daemonId`);
    }
    const apiKey = req.headers.authorization;
    if (!apiKey) {
        throw new OGSHError("auth/invalid", `'authorization' header should be the daemon's API key`);
    }
    
    res.locals.daemon = await DATABASE.getDaemon(daemonId);
    if (!isDaemonApiKeyValid(apiKey, res.locals.daemon)) {
        throw new OGSHError("auth/invalid", `invalid API key for daemon id '${daemonId}'`);
    }

    next();
}