import { Logger } from "@open-game-server-host/backend-lib";
import { getDbType } from "../env";
import { ContainerDb } from "./containerDb";
import { ContainerPortDb } from "./containerPortDb";
import { DaemonDb } from "./daemonDb";
import { IpDb } from "./ipDb";
import { LocalContainerDb } from "./local/localContainerDb";
import { LocalContainerPortDb } from "./local/localContainerPortDb";
import { LocalDaemonDb } from "./local/localDaemonDb";
import { LocalIpDb } from "./local/localIpDb";
import { LocalRegionDb } from "./local/localRegionDb";
import { LocalUserDb } from "./local/localUserDb";
import { PostgresContainerDb } from "./postgres/postgresContainerDb";
import { PostgresContainerPortDb } from "./postgres/postgresContainerPortDb";
import { PostgresDaemonDb } from "./postgres/postgresDaemonDb";
import { PostgresIpDb } from "./postgres/postgresIpDb";
import { PostgresRegionDb } from "./postgres/postgresRegionDb";
import { PostgresUserDb } from "./postgres/postgresUserDb";
import { RegionDb } from "./regionDb";
import { UserDb } from "./userDb";

export type DbType =
    | "local"
    | "postgres"
;

const logger = new Logger("DATABASE");
logger.info(`Initialising databases`, {
    type: getDbType()
});

export const DATABASE = {
    container: getContainerDb(),
    container_port: getContainerPortDb(),
    daemon: getDaemonDb(),
    ip: getIpDb(),
    region: getRegionDb(),
    user: getUserDb()
} as const;

function getContainerDb(): ContainerDb {
    switch (getDbType()) {
        case "local": {
            return new LocalContainerDb();
        }
        case "postgres": {
            return new PostgresContainerDb();
        }
    }
}

function getContainerPortDb(): ContainerPortDb {
    switch (getDbType()) {
        case "local": {
            return new LocalContainerPortDb();
        }
        case "postgres": {
            return new PostgresContainerPortDb();
        }
    }
}

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

function getIpDb(): IpDb {
    switch (getDbType()) {
        case "local": {
            return new LocalIpDb();
        }
        case "postgres": {
            return new PostgresIpDb();
        }
    }
}

function getRegionDb(): RegionDb {
    switch (getDbType()) {
        case "local": {
            return new LocalRegionDb();
        }
        case "postgres": {
            return new PostgresRegionDb();
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