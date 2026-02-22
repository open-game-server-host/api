import { BodyRequest, respond } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { daemonAuthMiddleware, DaemonResponse } from "../../auth/daemonAuth.js";
import { DATABASE } from "../../db/db.js";
import { SetupDaemonData } from "../../interfaces/daemon.js";

export const daemonHttpRouter = Router();

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.post("/", async (req, res) => {
    const daemon = await DATABASE.createDaemon();
    respond(res, daemon);
});

// TODO verify daemon api key
daemonHttpRouter.post("/:daemonId/setup", async (req: BodyRequest<SetupDaemonData>, res) => {
    const daemon = await DATABASE.setupDaemon(req.params.daemonId, req.body);
    respond(res, daemon);
});

// daemonHttpRouter.get("/:daemonId", async (req, res) => {
//     const daemonId = req.params.daemonId;
//     const daemon = await DATABASE.getDaemon(daemonId);
//     respond(res, daemon);
// });

daemonHttpRouter.post("/:daemonId/containers", daemonAuthMiddleware, async (req, res: DaemonResponse) => {
    const containers = await DATABASE.listActiveContainersByDaemon(res.locals.daemon.id);
    respond(res, containers);
});

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.post("/list", async (req, res) => {

});

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.delete("/:daemonId", async (req, res) => {

});