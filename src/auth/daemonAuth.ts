import { Daemon, OGSHError } from "@open-game-server-host/backend-lib";
import { NextFunction, Request, Response } from "express";
import { hashDaemonApiKey, isDaemonApiKeyValid } from "../daemon/daemon.js";
import { DATABASE } from "../db/db.js";
import { SetupIncompleteDaemon } from "../interfaces/daemon.js";

export interface DaemonLocals {
    daemon: Daemon | SetupIncompleteDaemon;
}

export type DaemonResponse = Response<any, DaemonLocals>;

export async function daemonAuthMiddleware(req: Request, res: DaemonResponse, next: NextFunction) {
    const apiKey = req.headers.authorization;
    if (!apiKey) {
        throw new OGSHError("auth/invalid", `'authorization' header should be the daemon's API key`);
    }
    
    const hash = hashDaemonApiKey(apiKey);
    res.locals.daemon = await DATABASE.getDaemonByApiKeyHash(hash);

    if (!isDaemonApiKeyValid(apiKey, res.locals.daemon)) {
        throw new OGSHError("auth/invalid", `invalid API key for daemon id '${res.locals.daemon.id}'`);
    }

    next();
}