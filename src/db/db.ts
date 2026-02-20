import { Container, Daemon, Ip, OGSHError, Region, User } from "@open-game-server-host/backend-lib";
import { getDbType } from "../env.js";
import { CreateContainerData } from "../interfaces/container.js";
import { SetupDaemonData, SetupIncompleteDaemon } from "../interfaces/daemon.js";
import { CreateIpData } from "../interfaces/ip.js";
import { CreateRegionData } from "../interfaces/region.js";
import { LocalContainerDb } from "./local/localContainerDb.js";
import { LocalDaemonDb } from "./local/localDaemonDb.js";
import { LocalIpDb } from "./local/localIpDb.js";
import { LocalRegionDb } from "./local/localRegionDb.js";
import { LocalUserDb } from "./local/localUserDb.js";

export type DbType =
    | "local"
    | "postgres"
;

export interface Database {
    getContainer(containerId: string): Promise<Container>;
    createContainer(data: CreateContainerData): Promise<Container>;
    terminateContainer(containerId: string): Promise<Container>;
    listActiveContainersByUser(uid: string): Promise<Container[]>; // TOOD paginate
    listActiveContainersByDaemon(daemonId: string): Promise<Container[]>; // TODO paginate
    // logContainerAction(containerId: string, action: string, data: string): Promise<void>;

    getDaemon(daemonId: string): Promise<Daemon>;
    createDaemon(): Promise<SetupIncompleteDaemon & { api_key: string }>;
    setupDaemon(daemonId: string, data: SetupDaemonData): Promise<Daemon>;
    listDaemonsByRegion(regionId: string): Promise<Daemon[]>; // TODO paginate
    listSetupIncompleteDaemons(): Promise<SetupIncompleteDaemon[]>; // TODO paginate

    getIp(ipId: string): Promise<Ip>;
    createIp(data: CreateIpData): Promise<Ip>;
    listIps(): Promise<Ip[]>; // TODO paginate

    getRegion(ipId: string): Promise<Region>;
    createRegion(data: CreateRegionData): Promise<Region>;
    listRegions(): Promise<Region[]>;

    doesUserExist(id: string): Promise<boolean>;
    getUser(authUid: string): Promise<User>;
    createUser(authUid: string, ): Promise<User>;
}

export const DATABASE = createDb();

function createDb(): Database {
    switch (getDbType()) {
        case "local": return createLocalDb();
        case "postgres": return createPostgresDb();
        default: throw new OGSHError("general/unspecified", "no db type defined");
    }
}

function createLocalDb(): Database {
    const containerDb = new LocalContainerDb();
    const daemonDb = new LocalDaemonDb();
    const ipDb = new LocalIpDb();
    const regionDb = new LocalRegionDb();
    const userDb = new LocalUserDb();

    return {
        createContainer: containerDb.createContainer.bind(containerDb),
        terminateContainer: containerDb.terminateContainer.bind(containerDb),
        getContainer: containerDb.getContainer.bind(containerDb),
        listActiveContainersByDaemon: containerDb.listActiveContainersByDaemon.bind(containerDb),
        listActiveContainersByUser: containerDb.listActiveContainersByUser.bind(containerDb),
        
        getDaemon: daemonDb.getDaemon.bind(daemonDb),
        createDaemon: daemonDb.createDaemon.bind(daemonDb),
        setupDaemon: daemonDb.setupDaemon.bind(daemonDb),
        listDaemonsByRegion: daemonDb.listDaemonsByRegion.bind(daemonDb),
        listSetupIncompleteDaemons: daemonDb.listSetupIncompleteDaemons.bind(daemonDb),

        getIp: ipDb.getIp.bind(ipDb),
        createIp: ipDb.createIp.bind(ipDb),
        listIps: ipDb.listIps.bind(ipDb),

        getRegion: regionDb.getRegion.bind(regionDb),
        createRegion: regionDb.createRegion.bind(regionDb),
        listRegions: regionDb.listRegions.bind(regionDb),

        doesUserExist: userDb.doesUserExist.bind(userDb),
        getUser: userDb.getUser.bind(userDb),
        createUser: userDb.createUser.bind(userDb)
    }
}

function createPostgresDb(): Database {
    function notImplemented<T>(): Promise<T> {
        throw new Error("not implemented");
    }

    return {
        createContainer: notImplemented<Container>,
        terminateContainer: notImplemented<Container>,
        getContainer: notImplemented<Container>,
        listActiveContainersByDaemon: notImplemented<Container[]>,
        listActiveContainersByUser: notImplemented<Container[]>,
        listSetupIncompleteDaemons: notImplemented<SetupIncompleteDaemon[]>,

        getDaemon: notImplemented<Daemon>,
        createDaemon: notImplemented<Daemon & { api_key: string }>,
        setupDaemon: notImplemented<Daemon>,
        listDaemonsByRegion: notImplemented<Daemon[]>,

        getIp: notImplemented<Ip>,
        createIp: notImplemented<Ip>,
        listIps: notImplemented<Ip[]>,

        getRegion: notImplemented<Region>,
        createRegion: notImplemented<Region>,
        listRegions: notImplemented<Region[]>,

        doesUserExist: notImplemented<boolean>,
        getUser: notImplemented<User>,
        createUser: notImplemented<User>
    }
}