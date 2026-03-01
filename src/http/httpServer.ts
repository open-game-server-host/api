import { expressErrorHandler, Logger } from "@open-game-server-host/backend-lib";
import express from "express";
import { readFileSync } from "fs";
import https from "https";
import { userAuthMiddleware } from "../auth/userAuth.js";
import { getPort, getTlsCertPath, getTlsKeyPath } from "../env.js";
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
    router.use("/v1/container", userAuthMiddleware, containerHttpRouter); // TODO user validation middleware
    router.use("/v1/me", userAuthMiddleware, meHttpRouter); // TODO user validation middleware
    router.use("/v1/daemon", daemonHttpRouter); // TODO daemon validation middleware

    router.use(expressErrorHandler);

    const server = https.createServer({
        cert: readFileSync(getTlsCertPath()).toString(),
        key: readFileSync(getTlsKeyPath()).toString()
    }, router);
    server.on("upgrade", async (req, socket, head) => {
        wsServer.handleUpgrade(req, socket, head, (ws) => {
            wsServer.emit("connection", ws, req);
        });
    });

    await new Promise<void>(res => {
        server.listen(getPort(), () => {
            logger.info(`Started http server on port ${getPort()}`);
            res();
        });
    });
}