import { OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Response, Router } from "express";
import { userAuthMiddleware, UserLocals, userPermissionMiddleware } from "../../auth/userAuth.js";
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

meHttpRouter.post("/daemon", userPermissionMiddleware("createDaemon"), async (req, res) => {
    const daemon = await DATABASE.createDaemon();
    respond(res, daemon);
});

meHttpRouter.post("/daemons", userPermissionMiddleware("listDaemons"), async (req, res) => {
    throw new OGSHError("general/unspecified", `not implemented`);
});

meHttpRouter.delete("/daemon/:daemonId", userPermissionMiddleware("removeDaemon"), async (req, res) => {
    throw new OGSHError("general/unspecified", `not implemented`);
});