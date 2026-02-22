import { respond, UserLocals } from "@open-game-server-host/backend-lib";
import { Response, Router } from "express";
import { DATABASE } from "../../db/db.js";

export const meHttpRouter = Router();

type UserResponse = Response<any, UserLocals>;

meHttpRouter.get("/", async (req, res: UserResponse) => {
    respond(res, await DATABASE.getUser(res.locals.userId));
});

meHttpRouter.post("/", async (req, res: UserResponse) => {
    respond(res, await DATABASE.createUser(res.locals.userId));
});

meHttpRouter.get("/containers", async (req, res: UserResponse) => {
    respond(res, await DATABASE.listActiveContainersByUser(res.locals.userId));
});