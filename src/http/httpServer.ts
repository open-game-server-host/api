import { expressErrorHandler, getApiConfig, Logger } from "@open-game-server-host/backend-lib";
import express, { NextFunction, Request, Response } from "express";
import { readFileSync } from "fs";
import https from "https";
import { getPort, getTlsCertPath, getTlsKeyPath } from "../env.js";
import { wsServer } from "../ws/wsServer.js";
import { appHttpRouter } from "./routes/appHttpRoutes.js";
import { containerHttpRouter } from "./routes/containerHttpRoutes.js";
import { daemonHttpRouter } from "./routes/daemonHttpRoutes.js";
import { regionHttpRouter } from "./routes/regionHttpRoutes.js";
import { meHttpRouter } from "./routes/userHttpRoutes.js";

export async function initHttpServer(logger: Logger) {
    const router = express();
    router.use(express.json());

    router.use("/v1/apps", appHttpRouter);
    router.use("/v1/container", containerHttpRouter);
    router.use("/v1/me", meHttpRouter);
    router.use("/v1/daemon", daemonHttpRouter);
    router.use("/v1/region", regionHttpRouter);

    router.use((req, res, next) => {
        console.log(`Invalid path: ${req.path}`);
        next();
    });

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

export type PaginatedRequest<T = {}> = Request<any, any, T & { page: number, resultsPerPage: number }>;

export async function paginateMiddleware(req: PaginatedRequest, res: Response, next: NextFunction) {
    const { page, resultsPerPage } = req.body;

    if (typeof page !== "number" || !Number.isInteger(page) || page < 0) {
        req.body.page = 0;
    }

    const apiConfig = await getApiConfig();
    if (typeof resultsPerPage !== "number" || !Number.isInteger(resultsPerPage) || resultsPerPage < 1 || resultsPerPage > apiConfig.maxPaginatedResults) {
        req.body.resultsPerPage = apiConfig.maxPaginatedResults;
    }

    next();
}