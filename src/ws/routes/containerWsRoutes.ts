import { WsRouter } from "@open-game-server-host/backend-lib";

export const containerWsRouter = new WsRouter("container");

containerWsRouter.register("logsAndStats", (ws, body, locals) => {
    // TODO validate this container id is from this daemon
    // TODO forward statistics and console logs to connected clients
    console.log(`body: ${JSON.stringify(body)}`);
});

// TODO file endpoints