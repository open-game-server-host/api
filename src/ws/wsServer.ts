import { formatErrorResponseBody, getUrlQueryParams, Logger, OGSHError, WsMsg, WsRouter } from "@open-game-server-host/backend-lib";
import { WebSocket, WebSocketServer } from "ws";
import { authenticateUser } from "../auth/userAuth.js";
import { hashDaemonApiKey } from "../daemon/daemon.js";
import { DATABASE } from "../db/db.js";
import { BROKER } from "./brokers/broker.js";
import { containerWsRouter } from "./routes/containerWsRoutes.js";
import { WS_CLOSE_CODE } from "./wsCloseCode.js";

const logger = new Logger("WS");

export const wsServer = new WebSocketServer({ noServer: true });

const routers = new Map<string, WsRouter>();
function register(router: WsRouter) {
    routers.set(router.route, router);
}

register(containerWsRouter);

interface Params {
    type: string;
    id: string;
    authToken: string;
    containerId?: string;
}
wsServer.on("connection", async (ws, req) => {
    let type: string | undefined;
    let id: string | undefined;
    let disconnectFunction: () => void = () => {}; // TODO registering a user should return a disconnect function, which removes the user from the server when they disconnect

    ws.on("close", (code, reason) => {
        // TODO
        disconnectFunction();
        logger.info("Disconnected", {
            type,
            id
        });
    });

    ws.on("error", (ws: WebSocket, error: Error) => {
        const body = formatErrorResponseBody(error as Error);
        ws.send(JSON.stringify(body));
    });

    try {
        if (!req.url) {
            throw new OGSHError("ws/invalid-params", `need 'type', 'id', and 'authToken' url query params`);
        }
        const params = getUrlQueryParams<Params>(req.url); // TODO this might be bad because it logs in the browser and malicious addons could scrape your auth token
        type = params.type || "user";
        const { authToken, containerId } = params;
        if (typeof type !== "string") throw new OGSHError("ws/invalid-params", `'type' should be a string`);
        if (typeof authToken !== "string") throw new OGSHError("ws/invalid-params", `'authToken' should be a string`);

        logger.info("Connection", {
            type
        });

        switch (type) {
            case "user": {
                if (typeof containerId !== "string") throw new OGSHError("ws/invalid-params", `'containerId' should be a string`);
                // TODO implement a limit for connections to one container for one user, e.g. they have it open in 10 tabs and we have to send data to each instance
                const authUid = await authenticateUser(authToken);
                // TODO check whether the user has access to this container
                await BROKER.registerUserConnection(authUid, ws, containerId);
                ws.on("message", () => ws.close(WS_CLOSE_CODE.FORBIDDEN));
                logger.info("User connected", {
                    id
                });
                break;
            }
            case "daemon": {
                const hash = hashDaemonApiKey(authToken);
                const daemon = await DATABASE.getDaemonByApiKeyHash(hash);
                id = daemon.id;
                await BROKER.registerDaemonConnection(daemon.id, ws);
                ws.on("message", (data, isBinary) => handleWsMessage(ws, data, isBinary));
                break;
            }
            default: {
                throw new OGSHError("auth/invalid", `'type' query param was invalid`);
            }
        }
        logger.info("Connected", {
            type,
            id
        });
    } catch (error) {
        const responseBody = formatErrorResponseBody(error as Error);
        ws.send(JSON.stringify(responseBody));
        ws.close(WS_CLOSE_CODE.UNAUTHORIZED);
    }
});

function handleWsMessage(ws: WebSocket, data: WebSocket.RawData, isBinary: boolean) {
    // TODO handle binary data for file uploads/downloads
    let locals: any = {};
    try {
        const json = JSON.parse(data.toString()) as WsMsg;
        if (!json.route) throw new OGSHError("general/unspecified", `'route' missing`);
        if (!json.body) throw new OGSHError("general/unspecified", `'body' missing`);
        if (!json.action) throw new OGSHError("general/unspecified", `'action' missing`);

        const router = routers.get(json.route);
        if (!router) throw new OGSHError("general/unspecified", `router '${json.route}' not found`);

        router.call(json.action, ws, json.body, locals, logger);
    } catch (error) {
        const body = formatErrorResponseBody(error as Error);
        ws.send(JSON.stringify(body));
    }
}