import { getApps } from "@open-game-server-host/backend-lib";
import { Router } from "express";

export const appHttpRouter = Router();

appHttpRouter.get("/", async (req, res) => {
    const apps = await getApps();
    res.send(apps);
});