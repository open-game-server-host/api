import { BodyRequest, respond, sanitiseDaemon, UpdateDaemonData } from "@open-game-server-host/backend-lib";
import { Response, Router } from "express";
import { daemonAuthMiddleware, DaemonResponse } from "../../auth/daemonAuth.js";
import { userPermissionMiddleware } from "../../auth/userAuth.js";
import { DATABASE } from "../../db/db.js";
import { SetupDaemonData } from "../../interfaces/daemon.js";
import { paginateMiddleware } from "../httpServer.js";

export const daemonHttpRouter = Router();

daemonHttpRouter.post("/", userPermissionMiddleware("createDaemon"), async (req, res) => {
    const daemon = await DATABASE.createDaemon();
    respond(res, daemon);
});

daemonHttpRouter.post("/update", daemonAuthMiddleware, async (req: BodyRequest<UpdateDaemonData>, res: DaemonResponse) => {
    await DATABASE.updateDaemon(res.locals.daemon.id, req.body);
    respond(res);
});

daemonHttpRouter.post("/setup/:daemonId", userPermissionMiddleware("createDaemon"), async (req: BodyRequest<SetupDaemonData>, res: Response) => {
    await DATABASE.setupDaemon(req.params.daemonId, req.body);
    respond(res);
});

daemonHttpRouter.post("/update", daemonAuthMiddleware, async (req: BodyRequest<UpdateDaemonData>, res: DaemonResponse) => {
    await DATABASE.updateDaemon(res.locals.daemon.id, req.body);
    respond(res, await DATABASE.getDaemon(res.locals.daemon.id));
});

daemonHttpRouter.get("/", daemonAuthMiddleware, async (req, res: DaemonResponse) => {
    respond(res, sanitiseDaemon(res.locals.daemon));
});

daemonHttpRouter.post("/containers", paginateMiddleware, daemonAuthMiddleware, async (req, res: DaemonResponse) => {
    const containers = await DATABASE.listActiveContainersByDaemon(res.locals.daemon.id, req.body.page, req.body.resultsPerPage);
    respond(res, {
        containers,
        resultsPerPage: req.body.resultsPerPage
    });
});

daemonHttpRouter.delete("/delete/:daemonId", userPermissionMiddleware("removeDaemon"), async (req, res) => {
    throw new Error("not implemented");
});