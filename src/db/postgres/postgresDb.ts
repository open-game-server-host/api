import { Container, Daemon, Ip, Region } from "@open-game-server-host/backend-lib";
import { Pool } from "pg";
import { Database } from "../db";

export abstract class PostgresDb {
    private static pool: Pool;

    static {
        // // TODO load custom environment variables to get postgres connection details

        // this.pool = new Pool({
        //     // TODO
        // });

        // this.pool.on("connect", client => {
        //     // TODO
        // });

        // this.pool.on("error", (error, client) => {
        //     // TODO
        // });
    }
}