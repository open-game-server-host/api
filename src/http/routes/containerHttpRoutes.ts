import { BodyRequest, getVersion, OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Request, Response, Router } from "express";
import { body, param } from "express-validator";
import { containerAuthMiddleware, ContainerResponse } from "../../auth/containerAuth.js";
import { DATABASE } from "../../db/db.js";
import { BROKER } from "../../ws/brokers/broker.js";

export const containerHttpRouter = Router();

const parseContainerId = param("containerId").isString();

type ContainerRequest<B = any> = Request<{ containerId: string }, any, B>;

containerHttpRouter.get("/:containerId", parseContainerId, containerAuthMiddleware(), async (req: ContainerRequest, res: ContainerResponse) => {
    respond(res, res.locals.containerWithPermissions);
});

containerHttpRouter.delete("/:containerId", parseContainerId, containerAuthMiddleware(["terminate"]), async (req: ContainerRequest, res: ContainerResponse) => {
    await BROKER.removeContainer(res.locals.containerWithPermissions.daemon.id, res.locals.containerWithPermissions.id)
    respond(res);
});

containerHttpRouter.post("/:containerId/cancel", parseContainerId, async (req: ContainerRequest, res) => {
    // TODO undo termination if before the end date
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/image", parseContainerId, containerAuthMiddleware(["setRuntime"]), async (req: ContainerRequest, res: ContainerResponse) => {
    // TODO set docker runtime image
    throw new OGSHError("general/unspecified", `not implemented`);
});

interface ContainerInstallBody {
    appId: string;
    variantId: string;
    versionId: string;
}
containerHttpRouter.post("/:containerId/install", parseContainerId, [
    body("appId").isString(),
    body("variantId").isString(),
    body("versionId").isString()
], containerAuthMiddleware(["install"]), async (req: ContainerRequest<ContainerInstallBody>, res: Response) => {
    const { appId, variantId, versionId } = req.body;
    await getVersion(appId, variantId, versionId);
    const container = await DATABASE.getContainer(req.params.containerId);
    // TODO update database record
    await BROKER.installContainer(container.daemon.id, container.id, {
        appId,
        variantId,
        versionId
    });
    respond(res);
});

interface ContainerNameBody {
    name: string;
}
containerHttpRouter.post("/:containerId/name", containerAuthMiddleware(["setName"]), async (req: ContainerRequest<ContainerNameBody>, res: ContainerResponse) => {
    // TODO update database record
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/resize", containerAuthMiddleware(["resize"]), async (req, res) => {
    // TODO adjust container segments up or down, may have to relocate to find enough segments
    // TODO requires backups
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/region", containerAuthMiddleware(["changeRegion"]), async (req, res) => {
    // TODO relocate the container to the specified region
    // TODO requires backups
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/backup", containerAuthMiddleware(["makeBackup"]), async (req, res) => {
    // TODO tell container to start a backup, user will need to select where they want it sent to e.g. google drive, dropbox, onedrive, backblaze, s3, sftp etc
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/start", containerAuthMiddleware(["start"]), async (req, res: ContainerResponse) => {
    await BROKER.startContainer(res.locals.containerWithPermissions.daemon.id, res.locals.containerWithPermissions.id);
    respond(res);
});

containerHttpRouter.post("/:containerId/stop", containerAuthMiddleware(["stop"]), async (req, res: ContainerResponse) => {
    await BROKER.stopContainer(res.locals.containerWithPermissions.daemon.id, res.locals.containerWithPermissions.id);
    respond(res);
});

containerHttpRouter.post("/:containerId/restart", containerAuthMiddleware(["start", "stop"]), async (req, res: ContainerResponse) => {
    await BROKER.restartContainer(res.locals.containerWithPermissions.daemon.id, res.locals.containerWithPermissions.id);
    respond(res);
});

containerHttpRouter.post("/:containerId/kill", containerAuthMiddleware(["kill"]), async (req, res: ContainerResponse) => {
    await BROKER.killContainer(res.locals.containerWithPermissions.daemon.id, res.locals.containerWithPermissions.id);
    respond(res);
});

interface CommandBody {
    command: string;
}
containerHttpRouter.post("/:containerId/command", [body("command").isString()], containerAuthMiddleware(["command"]), async (req: BodyRequest<CommandBody>, res: ContainerResponse) => {
    await BROKER.sendCommandToContainer(res.locals.containerWithPermissions.daemon.id, res.locals.containerWithPermissions.id, req.body.command);
    respond(res);
});

containerHttpRouter.post("/:containerId/config", async (req, res) => {
    // Note that to get config data, you must use the files endpoints
    // TODO send internal request
    throw new OGSHError("general/unspecified", `not implemented`);
});