import { Container, CreateContainerData, Daemon, DaemonData, Ip, IpData, OGSHError, Region, RegionData } from "@open-game-server-host/backend-lib";
import { getDbType } from "../env";
import { LocalContainerDb } from "./local/localContainerDb";
import { LocalDaemonDb } from "./local/localDaemonDb";
import { LocalIpDb } from "./local/localIpDb";
import { LocalRegionDb } from "./local/localRegionDb";

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
    createDaemon(data: DaemonData): Promise<Daemon>;
    listDaemonsByRegion(regionId: string): Promise<Daemon[]>;

    getIp(ipId: string): Promise<Ip>;
    createIp(data: IpData): Promise<Ip>;
    listIps(): Promise<Ip[]>; // TODO paginate

    getRegion(ipId: string): Promise<Region>;
    createRegion(data: RegionData): Promise<Region>;
    listRegions(): Promise<Region[]>;
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

    return {
        createContainer: containerDb.createContainer.bind(containerDb),
        terminateContainer: containerDb.terminateContainer.bind(containerDb),
        getContainer: containerDb.getContainer.bind(containerDb),
        listActiveContainersByDaemon: containerDb.listActiveContainersByDaemon.bind(containerDb),
        listActiveContainersByUser: containerDb.listActiveContainersByUser.bind(containerDb),

        getDaemon: daemonDb.getDaemon.bind(daemonDb),
        createDaemon: daemonDb.createDaemon.bind(daemonDb),
        listDaemonsByRegion: daemonDb.listDaemonsByRegion.bind(daemonDb),

        getIp: ipDb.getIp.bind(ipDb),
        createIp: ipDb.createIp.bind(ipDb),
        listIps: ipDb.listIps.bind(ipDb),

        getRegion: regionDb.getRegion.bind(regionDb),
        createRegion: regionDb.createRegion.bind(regionDb),
        listRegions: regionDb.listRegions.bind(regionDb)
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

        getDaemon: notImplemented<Daemon>,
        createDaemon: notImplemented<Daemon>,
        listDaemonsByRegion: notImplemented<Daemon[]>,

        getIp: notImplemented<Ip>,
        createIp: notImplemented<Ip>,
        listIps: notImplemented<Ip[]>,

        getRegion: notImplemented<Region>,
        createRegion: notImplemented<Region>,
        listRegions: notImplemented<Region[]>
    }
}