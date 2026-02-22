import { WsRouter } from "@open-game-server-host/backend-lib";

export const containerWsRouter = new WsRouter("container");

containerWsRouter.register("data", (ws, body, locals) => {
    // TODO forward statistics and console logs to connected clients
});

// TODO file endpoints