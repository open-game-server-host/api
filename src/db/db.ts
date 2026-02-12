import { getDbType } from "../env";
import { DaemonDb } from "./daemonDb";
import { LocalDaemonDb } from "./local/localDaemonDb";
import { LocalUserDb } from "./local/localUserDb";
import { PostgresDaemonDb } from "./postgres/postgresDaemonDb";
import { PostgresUserDb } from "./postgres/postgresUserDb";
import { UserDb } from "./userDb";

export type DbType =
    | "local"
    | "postgres"
;

export const DAEMON_DB: DaemonDb = getDaemonDb();
export const USER_DB: UserDb = getUserDb();

function getDaemonDb(): DaemonDb {
    switch (getDbType()) {
        case "local": {
            return new LocalDaemonDb();
        }
        case "postgres": {
            return new PostgresDaemonDb();
        }
    }
}

function getUserDb(): UserDb {
    switch (getDbType()) {
        case "local": {
            return new LocalUserDb();
        }
        case "postgres": {
            return new PostgresUserDb();
        }
    }
}