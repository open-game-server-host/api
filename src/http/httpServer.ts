import { expressErrorHandler, Logger } from "@open-game-server-host/backend-lib";
import express from "express";
import { appHttpRouter } from "./routes/appRoutes";
import { containerHttpRouter } from "./routes/containerRoutes";
import { daemonHttpRouter } from "./routes/daemonRoutes";
import { userHttpRouter } from "./routes/userRoutes";

export async function initHttpServer(logger: Logger) {
    const router = express();
    router.use(express.json());

    // TODO config routes
    router.use("/v1/apps", appHttpRouter);
    router.use("/v1/container", containerHttpRouter); // TODO user validation middleware
    router.use("/v1/me", userHttpRouter); // TODO user validation middleware
    router.use("/v1/daemon", daemonHttpRouter); // TODO daemon validation middleware

    router.use(expressErrorHandler);

    const port = 8080;
    router.listen(port, () => logger.info(`Started http server on port ${port}`));
}