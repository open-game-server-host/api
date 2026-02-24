import { BodyRequest, OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Response, Router } from "express";
import { body } from "express-validator";
import { userAuthMiddleware, UserLocals, userPermissionMiddleware, UserPermissionResponse } from "../../auth/userAuth.js";
import { createContainer } from "../../container/container.js";
import { DATABASE } from "../../db/db.js";

export const meHttpRouter = Router();

type UserResponse = Response<any, UserLocals>;

meHttpRouter.get("/", userAuthMiddleware, async (req, res: UserResponse) => {
    const user = await DATABASE.getUser(res.locals.authUid);
    respond(res, user);
});

meHttpRouter.post("/", userAuthMiddleware, async (req, res: UserResponse) => {
    respond(res, await DATABASE.createUser(res.locals.authUid));
});

meHttpRouter.get("/containers", userAuthMiddleware, async (req, res: UserResponse) => {
    respond(res, await DATABASE.listActiveContainersByUser(res.locals.authUid));
});

interface ContainerCreateBody {
    appId: string;
    variantId: string;
    versionId: string;
    segments: number;
    name: string;
    regionId: string;
}
meHttpRouter.post("/container", [
    body("appId").isString(),
    body("variantId").isString(),
    body("versionId").isString(),
    body("segments").isInt({ min: 1 }), // TODO define max segments in global config
    body("name").isString().isLength({ min: 1, max: 30}),
    body("regionId").isString().isLength({ min: 3, max: 3})
], userPermissionMiddleware(["createContainer"]), async (req: BodyRequest<ContainerCreateBody>, res: UserPermissionResponse) => {
    const { appId, variantId, versionId, segments, name, regionId } = req.body;
    // TODO check user has enough tokens
    const container = await createContainer(res.locals.user.id, regionId, appId, variantId, versionId, segments, name);
    respond(res, container);
});

meHttpRouter.post("/daemon", userPermissionMiddleware(["createDaemon"]), async (req, res) => {
    const daemon = await DATABASE.createDaemon();
    respond(res, daemon);
});

meHttpRouter.post("/daemons", userPermissionMiddleware(["listDaemons"]), async (req, res) => {
    throw new OGSHError("general/unspecified", `not implemented`);
});

meHttpRouter.delete("/daemon/:daemonId", userPermissionMiddleware(["removeDaemon"]), async (req, res) => {
    throw new OGSHError("general/unspecified", `not implemented`);
});