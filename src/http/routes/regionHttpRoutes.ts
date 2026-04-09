import { respond } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { DATABASE } from "../../db/db.js";

export const regionHttpRouter = Router();

regionHttpRouter.get("/", async (req, res) => {
    const regions = DATABASE.listRegions();
    return respond(res, regions);
});