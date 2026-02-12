import { BodyRequest } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { DATABASE } from "../../db/db";
import { DaemonData } from "../../interfaces/daemon";

export const daemonHttpRouter = Router();

daemonHttpRouter.post("/", async (req: BodyRequest<DaemonData>, res) => {
    const daemon = await DATABASE.daemon.create(req.body);
    return res.send(daemon);
});

daemonHttpRouter.get("/:daemonId", async (req, res) => {
    const daemonId = req.params.daemonId;
    const daemon = await DATABASE.daemon.get(daemonId);
    return res.send(daemon);
});

daemonHttpRouter.post("/:daemonId/containers", async (req, res) => {
    const daemonId = req.params.daemonId;
    const containers = await DATABASE.container.listByDaemon(daemonId);
    return res.send(containers);
});

daemonHttpRouter.post("/list", async (req, res) => {

});

daemonHttpRouter.delete("/:daemonId", async (req, res) => {

});