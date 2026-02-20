import { BodyRequest, getVersion, OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Request, Response, Router } from "express";
import { body, param } from "express-validator";
import { createContainer } from "../../container/container.js";
import { sendInternalDaemonRequest } from "../../daemon/daemon.js";
import { DATABASE } from "../../db/db.js";

export const containerHttpRouter = Router();

const parseContainerId = param("containerId").isString();

type ContainerRequest<B = any> = Request<{ containerId: string }, any, B>;

// TODO this will be replaced by webhook from successful payment via stripe/paypal/etc
interface ContainerCreateBody {
    app_id: string;
    variant_id: string;
    version_id: string;
    segments: number;
    name: string;
    region_id: string;
}
containerHttpRouter.post("/", [
    body("app_id").isString(),
    body("variant_id").isString(),
    body("version_id").isString(),
    body("segments").isInt({ min: 1 }), // TODO define max segments in global config
    body("name").isString().isLength({ min: 1, max: 30}),
    body("region_id").isString().isLength({ min: 3, max: 3})
], async (req: BodyRequest<ContainerCreateBody>, res: Response) => {
    const { app_id, variant_id, version_id, segments, name, region_id } = req.body;
    const container = await createContainer("TODO user id", region_id, app_id, variant_id, version_id, segments, name);
    respond(res, container);
});

containerHttpRouter.get("/:containerId", parseContainerId, async (req: ContainerRequest, res) => {
    const container = DATABASE.getContainer(req.params.containerId);
    respond(res, container);
});

containerHttpRouter.delete("/:containerId", parseContainerId, async (req: ContainerRequest, res) => {
    const container = await DATABASE.terminateContainer(req.params.containerId);
    await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}/terminate`);
    throw new OGSHError("general/unspecified", `not implemented`);
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
    app_id: string;
    variant_id: string;
    version_id: string;
}
containerHttpRouter.post("/:containerId/install", parseContainerId, [
    body("app_id").isString(),
    body("variant_id").isString(),
    body("version_id").isString()
], async (req: ContainerRequest<ContainerInstallBody>, res: Response) => {
    const { app_id, variant_id, version_id } = req.body;
    await getVersion(app_id, variant_id, version_id);
    // TODO update database record
    // TODO send internal request
    respond(res);
});

interface ContainerNameBody {
    name: string;
}
containerHttpRouter.post("/:containerId/name", async (req: ContainerRequest<ContainerNameBody>, res) => {
    // TODO update database record
    respond(res);
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
    await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}/start`);
    respond(res);
});

containerHttpRouter.post("/:containerId/stop", async (req, res) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}/stop`);
    respond(res);
});

containerHttpRouter.post("/:containerId/restart", async (req, res) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}/restart`);
    respond(res);
});

containerHttpRouter.post("/:containerId/kill", async (req, res) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}/kill`);
    respond(res);
});

interface CommandBody {
    command: string;
}
containerHttpRouter.post("/:containerId/command", [
    body("command").isString()
], async (req: BodyRequest<CommandBody>, res: Response) => {
    const container = await DATABASE.getContainer(req.params.containerId);
    await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}/command`, req.body);
    respond(res);
});

containerHttpRouter.post("/:containerId/config", async (req, res) => {
    // Note that to get config data, you must use the files endpoints
    // TODO send internal request
    throw new OGSHError("general/unspecified", `not implemented`);
});