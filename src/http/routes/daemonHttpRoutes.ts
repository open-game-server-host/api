import { BodyRequest, respond } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { daemonAuthMiddleware, DaemonResponse } from "../../auth/daemonAuth.js";
import { DATABASE } from "../../db/db.js";
import { SetupDaemonData } from "../../interfaces/daemon.js";

export const daemonHttpRouter = Router();

daemonHttpRouter.post("/:daemonId/setup", daemonAuthMiddleware, async (req: BodyRequest<SetupDaemonData>, res: DaemonResponse) => {
    const daemon = await DATABASE.setupDaemon(req.params.daemonId, req.body);
    respond(res, daemon);
});

daemonHttpRouter.post("/:daemonId/containers", daemonAuthMiddleware, async (req, res: DaemonResponse) => {
    const containers = await DATABASE.listActiveContainersByDaemon(res.locals.daemon.id);
    respond(res, containers);
});