import { expressErrorHandler, Logger, userAuthMiddleware } from "@open-game-server-host/backend-lib";
import express from "express";
import { createServer } from "http";
import { wsServer } from "../ws/wsServer.js";
import { appHttpRouter } from "./routes/appHttpRoutes.js";
import { containerHttpRouter } from "./routes/containerHttpRoutes.js";
import { daemonHttpRouter } from "./routes/daemonHttpRoutes.js";
import { meHttpRouter } from "./routes/userHttpRoutes.js";

export async function initHttpServer(logger: Logger) {
    const router = express();
    router.use(express.json());

    // TODO config routes
    router.use("/v1/apps", appHttpRouter);
    router.use("/v1/container", containerHttpRouter); // TODO user validation middleware
    router.use("/v1/me", userAuthMiddleware, meHttpRouter); // TODO user validation middleware
    router.use("/v1/daemon", daemonHttpRouter); // TODO daemon validation middleware

    router.use(expressErrorHandler);

    const httpServer = createServer(router);
    httpServer.on("upgrade", async (req, socket, head) => {
        wsServer.handleUpgrade(req, socket, head, (ws) => {
            wsServer.emit("connection", ws, req);
        });
    });

    const port = 8080;
    await new Promise<void>(res => {
        httpServer.listen(port, () => {
            logger.info(`Started http server on port ${port}`);
            res();
        });
    });
}