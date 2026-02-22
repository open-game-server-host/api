import { Container, Daemon, Ip, OGSHError, Region, User } from "@open-game-server-host/backend-lib";
import { getDbType } from "../env.js";
import { CreateContainerData } from "../interfaces/container.js";
import { SetupDaemonData, SetupIncompleteDaemon } from "../interfaces/daemon.js";
import { CreateRegionData } from "../interfaces/region.js";
import { LocalContainerDb } from "./local/localContainerDb.js";
import { LocalDaemonDb } from "./local/localDaemonDb.js";
import { LocalIpv4Db, LocalIpv6Db } from "./local/localIpDb.js";
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

    getIpv4(ipId: string): Promise<Ip>;
    getIpv4ByIp(ipv4: string): Promise<Ip>;
    listIpv4s(): Promise<Ip[]>; // TODO paginate

    getIpv6(ipId: string): Promise<Ip>;
    getIpv6ByIp(ipv6: string): Promise<Ip>;
    listIpv6s(): Promise<Ip[]>; // TODO paginate

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
    const ipv4Db = new LocalIpv4Db();
    const ipv6Db = new LocalIpv6Db();
    
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

        getIpv4: ipv4Db.getIpv4.bind(ipv4Db),
        getIpv4ByIp: ipv4Db.getIpv4ByIp.bind(ipv4Db),
        listIpv4s: ipv4Db.listIpv4s.bind(ipv4Db),

        getIpv6: ipv6Db.getIpv6.bind(ipv6Db),
        getIpv6ByIp: ipv6Db.getIpv6ByIp.bind(ipv6Db),
        listIpv6s: ipv6Db.listIpv6s.bind(ipv6Db),

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

        getIpv4: notImplemented<Ip>,
        getIpv4ByIp: notImplemented<Ip>,
        listIpv4s: notImplemented<Ip[]>,

        getIpv6: notImplemented<Ip>,
        getIpv6ByIp: notImplemented<Ip>,
        listIpv6s: notImplemented<Ip[]>,

        getRegion: notImplemented<Region>,
        createRegion: notImplemented<Region>,
        listRegions: notImplemented<Region[]>,

        doesUserExist: notImplemented<boolean>,
        getUser: notImplemented<User>,
        createUser: notImplemented<User>
    }
}