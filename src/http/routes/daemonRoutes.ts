import { BodyRequest, DaemonData, respond } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { DATABASE } from "../../db/db";

export const daemonHttpRouter = Router();

daemonHttpRouter.post("/", async (req: BodyRequest<DaemonData>, res) => {
    const daemon = await DATABASE.createDaemon(req.body);
    respond(res, daemon);
});

daemonHttpRouter.get("/:daemonId", async (req, res) => {
    const daemonId = req.params.daemonId;
    const daemon = await DATABASE.getDaemon(daemonId);
    respond(res, daemon);
});

daemonHttpRouter.post("/:daemonId/containers", async (req, res) => {
    const daemonId = req.params.daemonId;
    const containers = await DATABASE.listActiveContainersByDaemon(daemonId);
    respond(res, containers);
});

daemonHttpRouter.post("/list", async (req, res) => {

});

daemonHttpRouter.delete("/:daemonId", async (req, res) => {

});