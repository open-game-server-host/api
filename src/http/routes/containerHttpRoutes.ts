import { BodyRequest, getVersion, OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Request, Router } from "express";
import { body, param } from "express-validator";
import { containerAuthMiddleware, ContainerResponse } from "../../auth/containerAuth.js";
import { userPermissionMiddleware, UserPermissionResponse } from "../../auth/userAuth.js";
import { createContainer } from "../../container/container.js";
import { DATABASE } from "../../db/db.js";
import { BROKER } from "../../ws/brokers/broker.js";

export const containerHttpRouter = Router();

const parseContainerId = param("containerId").isString();

type ContainerRequest<B = any> = Request<{ containerId: string }, any, B>;

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
    body("segments").isInt({ min: 1 }),
    body("name").isString().isLength({ min: 1, max: 30}),
    body("regionId").isString().isLength({ min: 3, max: 3})
], userPermissionMiddleware("createContainer"), async (req: BodyRequest<ContainerCreateBody>, res: UserPermissionResponse) => {
    const { appId, variantId, versionId, segments, name, regionId } = req.body;
    const container = await createContainer(res.locals.user.id, regionId, appId, variantId, versionId, segments, name);
    respond(res, container);
});

containerHttpRouter.get("/:containerId", parseContainerId, containerAuthMiddleware(), async (req: ContainerRequest, res: ContainerResponse) => {
    respond(res, res.locals.container);
});

containerHttpRouter.get("/:containerId", parseContainerId, async (req: ContainerRequest, res) => {
    const container = DATABASE.getContainer(req.params.containerId);
    respond(res, container);
});

interface ContainerTerminateBody {
    date: Date;
}
containerHttpRouter.delete("/:containerId", parseContainerId, containerAuthMiddleware("terminate"), async (req: ContainerRequest<ContainerTerminateBody>, res: ContainerResponse) => {
    await DATABASE.terminateContainer(res.locals.container.id, req.body.date);
    await BROKER.removeContainer(res.locals.container.daemon.id, res.locals.container.id)
    respond(res);
});

containerHttpRouter.post("/:containerId/cancel", parseContainerId, containerAuthMiddleware("terminate"), async (req: ContainerRequest, res: ContainerResponse) => {
    await DATABASE.cancelTerminateContainer(res.locals.container.id);
    respond(res);
});

interface ContainerRuntimeBody {
    runtime: string;
}
containerHttpRouter.post("/:containerId/runtime", parseContainerId, body("runtime").isString(), containerAuthMiddleware("setRuntime"), async (req: ContainerRequest<ContainerRuntimeBody>, res: ContainerResponse) => {
    const { appId, variantId, versionId } = res.locals.container;
    const version = await getVersion(appId, variantId, versionId);
    if (!(version?.supportedRuntimes || []).includes(req.body.runtime)) { // TODO move this to db validators
        throw new OGSHError("container/invalid-runtime", `invalid runtime '${req.body.runtime}' for app id '${appId}' variant id '${variantId}' version id '${versionId}'`);
    }
    await DATABASE.setContainerRuntime(res.locals.container.id, req.body.runtime);
    await BROKER.updateContainerRuntime(res.locals.container.daemon.id, res.locals.container.id, req.body.runtime);
    await DATABASE.addContainerAuditLog({
        action: "setRuntime",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
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
], containerAuthMiddleware("install"), async (req: ContainerRequest<ContainerInstallBody>, res: ContainerResponse) => {
    const { appId, variantId, versionId } = req.body;
    if (!await getVersion(appId, variantId, versionId)) {
        throw new OGSHError("app/version-not-found", `could not set container id '${res.locals.container.id}' to app id '${appId}' variant id '${variantId}' version id '${versionId}'`);
    }
    await DATABASE.setContainerApp(req.params.containerId, appId, variantId, versionId);
    await BROKER.installContainer(res.locals.container.daemon.id, res.locals.container.id, {
        appId,
        variantId,
        versionId
    });
    await DATABASE.addContainerAuditLog({
        action: "install",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
});

interface ContainerNameBody {
    name: string;
}
containerHttpRouter.post("/:containerId/name", containerAuthMiddleware("setName"), async (req: ContainerRequest<ContainerNameBody>, res: ContainerResponse) => {
    await DATABASE.setContainerName(res.locals.container.id, req.body.name);
    await DATABASE.addContainerAuditLog({
        action: "setName",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
});

containerHttpRouter.post("/:containerId/start", containerAuthMiddleware("start"), async (req, res: ContainerResponse) => {
    await BROKER.startContainer(res.locals.container.daemon.id, res.locals.container.id);
    await DATABASE.addContainerAuditLog({
        action: "start",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
});

containerHttpRouter.post("/:containerId/stop", containerAuthMiddleware("stop"), async (req, res: ContainerResponse) => {
    await BROKER.stopContainer(res.locals.container.daemon.id, res.locals.container.id);
    await DATABASE.addContainerAuditLog({
        action: "stop",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
});

containerHttpRouter.post("/:containerId/restart", containerAuthMiddleware("start", "stop"), async (req, res: ContainerResponse) => {
    await BROKER.restartContainer(res.locals.container.daemon.id, res.locals.container.id);
    await DATABASE.addContainerAuditLog({
        action: "restart",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
});

containerHttpRouter.post("/:containerId/kill", containerAuthMiddleware("kill"), async (req, res: ContainerResponse) => {
    await BROKER.killContainer(res.locals.container.daemon.id, res.locals.container.id);
    await DATABASE.addContainerAuditLog({
        action: "kill",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
});

interface CommandBody {
    command: string;
}
containerHttpRouter.post("/:containerId/command", body("command").isString(), containerAuthMiddleware("command"), async (req: BodyRequest<CommandBody>, res: ContainerResponse) => {
    await BROKER.sendCommandToContainer(res.locals.container.daemon.id, res.locals.container.id, req.body.command);
    await DATABASE.addContainerAuditLog({
        action: "command",
        containerId: res.locals.container.id,
        runAt: Date.now(),
        user: res.locals.user
    });
    respond(res);
});