import { respond } from "@open-game-server-host/backend-lib";
import { Response, Router } from "express";
import { userAuthMiddleware, UserLocals, userPermissionMiddleware } from "../../auth/userAuth.js";
import { DATABASE } from "../../db/db.js";
import { PaginatedRequest, paginateMiddleware } from "../httpServer.js";

export const meHttpRouter = Router();

type UserResponse = Response<any, UserLocals>;

meHttpRouter.get("/", userAuthMiddleware, async (req, res: UserResponse) => {
    const user = await DATABASE.getUser(res.locals.authUid);
    respond(res, user);
});

meHttpRouter.post("/", userAuthMiddleware, async (req, res: UserResponse) => {
    respond(res, await DATABASE.createUser(res.locals.authUid, res.locals.email));
});

meHttpRouter.get("/containers", paginateMiddleware, userAuthMiddleware, async (req: PaginatedRequest, res: UserResponse) => {
    respond(res, {
        containers: await DATABASE.listActiveContainersByUser(res.locals.authUid, req.body.page, req.body.resultsPerPage),
        resultsPerPage: req.body.resultsPerPage
    });
});

meHttpRouter.post("/daemon", userPermissionMiddleware("createDaemon"), async (req, res) => {
    const daemon = await DATABASE.createDaemon();
    respond(res, daemon);
});

// meHttpRouter.post("/daemons", userPermissionMiddleware("listDaemons"), async (req, res) => {
//     throw new OGSHError("general/unspecified", `not implemented`);
// });

// meHttpRouter.delete("/daemon/:daemonId", userPermissionMiddleware("removeDaemon"), async (req, res) => {
//     throw new OGSHError("general/unspecified", `not implemented`);
// });