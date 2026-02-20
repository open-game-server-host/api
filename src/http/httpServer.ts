import { expressErrorHandler, Logger, userAuthMiddleware } from "@open-game-server-host/backend-lib";
import express from "express";
import { appHttpRouter } from "./routes/appRoutes.js";
import { containerHttpRouter } from "./routes/containerRoutes.js";
import { daemonHttpRouter } from "./routes/daemonRoutes.js";
import { meHttpRouter } from "./routes/userRoutes.js";

export async function initHttpServer(logger: Logger) {
    const router = express();
    router.use(express.json());

    // TODO config routes
    router.use("/v1/apps", appHttpRouter);
    router.use("/v1/container", containerHttpRouter); // TODO user validation middleware
    router.use("/v1/me", userAuthMiddleware, meHttpRouter); // TODO user validation middleware
    router.use("/v1/daemon", daemonHttpRouter); // TODO daemon validation middleware

    router.use(expressErrorHandler);

    const port = 8080;
    await new Promise<void>(res => {
        router.listen(port, () => {
            logger.info(`Started http server on port ${port}`);
            res();
        });
    });
}