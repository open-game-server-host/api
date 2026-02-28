import { BodyRequest, respond, sanitiseDaemon } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { daemonAuthMiddleware, DaemonResponse } from "../../auth/daemonAuth.js";
import { DATABASE } from "../../db/db.js";
import { SetupDaemonData, UpdateDaemonData } from "../../interfaces/daemon.js";

export const daemonHttpRouter = Router();

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.post("/", async (req, res) => {
    const daemon = await DATABASE.createDaemon();
    respond(res, daemon);
});

daemonHttpRouter.post("/update", daemonAuthMiddleware, async (req: BodyRequest<UpdateDaemonData>, res: DaemonResponse) => {
    await DATABASE.updateDaemon(res.locals.daemon.id, req.body);
    respond(res);
});

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.post("/setup/:daemonId", async (req: BodyRequest<SetupDaemonData>, res) => {
    await DATABASE.setupDaemon(req.params.daemonId, req.body);
    respond(res);
});

daemonHttpRouter.get("/", daemonAuthMiddleware, async (req, res) => {
    respond(res, sanitiseDaemon(res.locals.daemon));
});

daemonHttpRouter.post("/containers", daemonAuthMiddleware, async (req, res: DaemonResponse) => {
    const containers = await DATABASE.listActiveContainersByDaemon(res.locals.daemon.id);
    respond(res, containers);
});

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.post("/list", async (req, res) => {
    throw new Error("not implemented");
});

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.delete("/:daemonId", async (req, res) => {
    throw new Error("not implemented");
});