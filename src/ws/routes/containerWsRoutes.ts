import { WsRouter } from "@open-game-server-host/backend-lib";
import { BROKER } from "../brokers/broker.js";

export const containerWsRouter = new WsRouter("container");

interface ContainerLogsAndStats {
    containerId: string;
    logsAndStats: {
        logs: string;
        stats: any;
    }
}
containerWsRouter.register("logsAndStats", async (ws, body: ContainerLogsAndStats, locals) => {
    // TODO validate this container id is from this daemon
    // TODO forward statistics and console logs to connected clients
    await BROKER.sendLogsAndStatsToUsers(body.containerId, body.logsAndStats);
});

// TODO file endpoints