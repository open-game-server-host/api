import { expressErrorHandler, Logger } from "@open-game-server-host/backend-lib";
import express, { Request } from "express";
import { appHttpRouter } from "./routes/appRoutes";
import { containerHttpRouter } from "./routes/containerRoutes";
import { userHttpRouter } from "./routes/userRoutes";

export async function initHttpServer(logger: Logger) {
    const router = express();
    router.use(express.json());

    // TODO config routes
    router.use("/v1/apps", appHttpRouter);
    router.use("/v1/container", containerHttpRouter); // TODO user validation middleware
    router.use("/v1/me", userHttpRouter); // TODO user validation middleware

    router.use(expressErrorHandler);

    const port = 8080;
    await new Promise<void>(res => {
        router.listen(port, () => {
            logger.info(`Started http server on port ${port}`);
            res();
        });
    });
}