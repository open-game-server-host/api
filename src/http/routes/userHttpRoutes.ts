import { respond } from "@open-game-server-host/backend-lib";
import { Response, Router } from "express";
import { UserLocals } from "../../auth/userAuth.js";
import { DATABASE } from "../../db/db.js";

export const meHttpRouter = Router();

type UserResponse = Response<any, UserLocals>;

meHttpRouter.get("/", async (req, res: UserResponse) => {
    respond(res, await DATABASE.getUser(res.locals.authUid));
});

meHttpRouter.post("/", async (req, res: UserResponse) => {
    console.log(2);
    respond(res, await DATABASE.createUser(res.locals.authUid));
});

meHttpRouter.get("/containers", async (req, res: UserResponse) => {
    respond(res, await DATABASE.listActiveContainersByUser(res.locals.authUid));
});