import { Logger } from "@open-game-server-host/backend-lib";
const logger = new Logger("MAIN");
logger.info("Starting");

import { initHttpServer } from "./http/httpServer";

async function init() {
    await initHttpServer(logger);
}

init().then(() => logger.info("Ready"));