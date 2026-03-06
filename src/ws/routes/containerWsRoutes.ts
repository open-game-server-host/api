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
    await BROKER.sendLogsAndStatsToUsers(body.containerId, body.logsAndStats);
});