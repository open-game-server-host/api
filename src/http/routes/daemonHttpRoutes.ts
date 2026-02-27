import { BodyRequest, OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { daemonAuthMiddleware, DaemonResponse } from "../../auth/daemonAuth.js";
import { hashDaemonApiKey } from "../../daemon/daemon.js";
import { DATABASE } from "../../db/db.js";
import { SetupDaemonData } from "../../interfaces/daemon.js";

export const daemonHttpRouter = Router();

// TODO this should be executed by a person with correct permissions
daemonHttpRouter.post("/", async (req, res) => {
    const daemon = await DATABASE.createDaemon();
    respond(res, daemon);
});

daemonHttpRouter.post("/:daemonId/setup", daemonAuthMiddleware, async (req: BodyRequest<SetupDaemonData>, res: DaemonResponse) => {
    const daemon = await DATABASE.setupDaemon(req.params.daemonId, req.body);
    respond(res, daemon);
});

daemonHttpRouter.get("/", async (req, res) => {
    const apiKey = req.headers.authorization;
    if (!apiKey) {
        throw new OGSHError("auth/invalid", `'authorization' header not provided`);
    }
    const hash = hashDaemonApiKey(apiKey);
    const daemon = await DATABASE.getDaemonByApiKeyHash(hash);
    respond(res, daemon);
});

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