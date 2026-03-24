import { getApp, getApps, getVariant, getVersion, respond } from "@open-game-server-host/backend-lib";
import { Router } from "express";

export const appHttpRouter = Router();

appHttpRouter.get("/", async (req, res) => {
    const apps = await getApps();
    respond(res, apps);
});

appHttpRouter.get("/:appId", async (req, res) => {
    const app = await getApp(req.params.appId);
    respond(res, app);
});

appHttpRouter.get("/:appId/:variantId", async (req, res) => {
    const variant = await getVariant(req.params.appId, req.params.variantId);
    respond(res, variant);
});

appHttpRouter.get("/:appId/:variantId/:versionId", async (req, res) => {
    const version = await getVersion(req.params.appId, req.params.variantId, req.params.versionId);
    respond(res, version);
});