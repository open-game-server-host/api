import { BodyRequest, getVersion, OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Request, Response, Router } from "express";
import { body, param } from "express-validator";
import { createContainer } from "../../container/container.js";
import { DATABASE } from "../../db/db.js";
import { BROKER } from "../../ws/brokers/broker.js";

export const containerHttpRouter = Router();

const parseContainerId = param("containerId").isString();

type ContainerRequest<B = any> = Request<{ containerId: string }, any, B>;

// TODO this will be replaced by webhook from successful payment via stripe/paypal/etc
interface ContainerCreateBody {
    appId: string;
    variantId: string;
    versionId: string;
    segments: number;
    name: string;
    regionId: string;
}
containerHttpRouter.post("/", [
    body("appId").isString(),
    body("variantId").isString(),
    body("versionId").isString(),
    body("segments").isInt({ min: 1 }), // TODO define max segments in global config
    body("name").isString().isLength({ min: 1, max: 30}),
    body("regionId").isString().isLength({ min: 3, max: 3})
], async (req: BodyRequest<ContainerCreateBody>, res: Response) => {
    const { appId, variantId, versionId, segments, name, regionId } = req.body;
    const container = await createContainer("TODO user id", regionId, appId, variantId, versionId, segments, name);
    respond(res, container);
});

containerHttpRouter.get("/:containerId", parseContainerId, async (req: ContainerRequest, res) => {
    const container = DATABASE.getContainer(req.params.containerId);
    respond(res, container);
});

containerHttpRouter.delete("/:containerId", parseContainerId, async (req: ContainerRequest, res) => {
    const container = await DATABASE.terminateContainer(req.params.containerId);
    await BROKER.removeContainer(container.daemon.id, container.id);
    respond(res);
});

containerHttpRouter.post("/:containerId/cancel", parseContainerId, async (req: ContainerRequest, res) => {
    // TODO undo termination if before the end date
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/image", parseContainerId, async (req: ContainerRequest, res) => {
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
], async (req: ContainerRequest<ContainerInstallBody>, res: Response) => {
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
containerHttpRouter.post("/:containerId/name", async (req: ContainerRequest<ContainerNameBody>, res) => {
    // TODO update database record
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/resize", async (req, res) => {
    // TODO adjust container segments up or down, may have to relocate to find enough segments
    // TODO requires backups
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/region", async (req, res) => {
    // TODO relocate the container to the specified region
    // TODO requires backups
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/backup", async (req, res) => {
    // TODO tell container to start a backup, user will need to select where they want it sent to e.g. google drive, dropbox, onedrive, backblaze, s3, sftp etc
    throw new OGSHError("general/unspecified", `not implemented`);
});

containerHttpRouter.post("/:containerId/start", async (req, res) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await BROKER.startContainer(container.daemon.id, container.id);
    respond(res);
});

containerHttpRouter.post("/:containerId/stop", async (req, res) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await BROKER.stopContainer(container.daemon.id, container.id);
    respond(res);
});

containerHttpRouter.post("/:containerId/restart", async (req, res) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await BROKER.restartContainer(container.daemon.id, container.id);
    respond(res);
});

containerHttpRouter.post("/:containerId/kill", async (req, res) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await BROKER.killContainer(container.daemon.id, container.id);
    respond(res);
});

interface CommandBody {
    command: string;
}
containerHttpRouter.post("/:containerId/command", [
    body("command").isString()
], async (req: BodyRequest<CommandBody>, res: Response) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await BROKER.sendCommandToContainer(container.daemon.id, container.id, req.body.command);
    respond(res);
});

containerHttpRouter.post("/:containerId/config", async (req, res) => {
    // Note that to get config data, you must use the files endpoints
    // TODO send internal request
    throw new OGSHError("general/unspecified", `not implemented`);
});