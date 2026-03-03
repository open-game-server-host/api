import { Container, Daemon, Ip, OGSHError, Region, UpdateDaemonData, User } from "@open-game-server-host/backend-lib";
import { getDbType } from "../env.js";
import { ContainerPermission, CreateContainerData } from "../interfaces/container.js";
import { SetupDaemonData, SetupIncompleteDaemon } from "../interfaces/daemon.js";
import { CreateRegionData } from "../interfaces/region.js";
import { UserPermission } from "../interfaces/user.js";
import { LocalContainerDb } from "./local/localContainerDb.js";
import { LocalDaemonDb } from "./local/localDaemonDb.js";
import { LocalIpDb } from "./local/localIpDb.js";
import { LocalRegionDb } from "./local/localRegionDb.js";
import { LocalUserDb } from "./local/localUserDb.js";
import { PostgresContainerDb } from "./postgres/postgresContainerDb.js";
import { PostgresDaemonDb } from "./postgres/postgresDaemonDb.js";
import { PostgresIpDb } from "./postgres/postgresIpDb.js";
import { PostgresRegionDb } from "./postgres/postgresRegionDb.js";
import { PostgresUserDb } from "./postgres/postgresUserDb.js";

export type DbType =
    | "local"
    | "postgres"
;

export interface Database {
    getContainer(containerId: string): Promise<Container>;
    getUserContainerPermissions(containerId: string, userId: string): Promise<ContainerPermission[]>;
    hasUserGotContainerPermissions(containerId: string, userId: string, ...permissions: ContainerPermission[]): Promise<boolean>;
    createContainer(data: CreateContainerData): Promise<Container>;
    terminateContainer(containerId: string, terminateAt: Date): Promise<void>;
    listActiveContainersByUser(authUid: string): Promise<Container[]>; // TOOD paginate
    listActiveContainersByDaemon(daemonId: string): Promise<Container[]>; // TODO paginate
    // logContainerAction(containerId: string, action: string, data: string): Promise<void>;

    getDaemon(daemonId: string): Promise<Daemon>;
    getDaemonByApiKeyHash(apiKeyHash: string): Promise<Daemon | SetupIncompleteDaemon>;
    createDaemon(): Promise<string>; // Returns API key
    updateDaemon(daemonId: string, data: UpdateDaemonData): Promise<void>;
    setupDaemon(daemonId: string, data: SetupDaemonData): Promise<void>;
    listDaemonsByRegion(regionId: string): Promise<Daemon[]>; // TODO paginate
    listSetupIncompleteDaemons(): Promise<SetupIncompleteDaemon[]>; // TODO paginate

    getIp(ipId: string): Promise<Ip>;
    getIpByValue(ip: string): Promise<Ip>;
    listIps(): Promise<Ip[]>; // TODO paginate

    getRegion(regionId: string): Promise<Region>;
    createRegion(data: CreateRegionData): Promise<Region>;
    listRegions(): Promise<Region[]>;

    doesUserExist(userId: string): Promise<boolean>;
    getUser(authUid: string): Promise<User>;
    createUser(authUid: string): Promise<User>;
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    hasUserGotPermissions(userId: string, permissions: UserPermission[]): Promise<boolean>;
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
        getContainer: containerDb.getContainer.bind(containerDb),
        getUserContainerPermissions: containerDb.getUserContainerPermissions.bind(containerDb),
        hasUserGotContainerPermissions: containerDb.hasUserGotContainerPermissions.bind(containerDb),
        createContainer: containerDb.createContainer.bind(containerDb),
        terminateContainer: containerDb.terminateContainer.bind(containerDb),
        listActiveContainersByDaemon: containerDb.listActiveContainersByDaemon.bind(containerDb),
        listActiveContainersByUser: containerDb.listActiveContainersByUser.bind(containerDb),
        
        getDaemon: daemonDb.getDaemon.bind(daemonDb),
        getDaemonByApiKeyHash: daemonDb.getDaemonByApiKeyHash.bind(daemonDb),
        createDaemon: daemonDb.createDaemon.bind(daemonDb),
        updateDaemon: daemonDb.updateDaemon.bind(daemonDb),
        setupDaemon: daemonDb.setupDaemon.bind(daemonDb),
        listDaemonsByRegion: daemonDb.listDaemonsByRegion.bind(daemonDb),
        listSetupIncompleteDaemons: daemonDb.listSetupIncompleteDaemons.bind(daemonDb),

        getIp: ipDb.getIp.bind(ipDb),
        getIpByValue: ipDb.getIpByValue.bind(ipDb),
        listIps: ipDb.listIps.bind(ipDb),

        getRegion: regionDb.getRegion.bind(regionDb),
        createRegion: regionDb.createRegion.bind(regionDb),
        listRegions: regionDb.listRegions.bind(regionDb),

        doesUserExist: userDb.doesUserExist.bind(userDb),
        getUser: userDb.getUser.bind(userDb),
        createUser: userDb.createUser.bind(userDb),
        getUserPermissions: userDb.getUserPermissions.bind(userDb),
        hasUserGotPermissions: userDb.hasUserGotPermissions.bind(userDb)
    }
}

function createPostgresDb(): Database {
    const containerDb = new PostgresContainerDb();
    const daemonDb = new PostgresDaemonDb();
    const ipDb = new PostgresIpDb();
    const regionDb = new PostgresRegionDb();
    const userDb = new PostgresUserDb();

    return {
        getContainer: containerDb.getContainer.bind(containerDb),
        getUserContainerPermissions: containerDb.getUserContainerPermissions.bind(containerDb),
        hasUserGotContainerPermissions: containerDb.hasUserGotContainerPermissions.bind(containerDb),
        createContainer: containerDb.createContainer.bind(containerDb),
        terminateContainer: containerDb.terminateContainer.bind(containerDb),
        listActiveContainersByDaemon: containerDb.listActiveContainersByDaemon.bind(containerDb),
        listActiveContainersByUser: containerDb.listActiveContainersByUser.bind(containerDb),
        
        getDaemon: daemonDb.getDaemon.bind(daemonDb),
        getDaemonByApiKeyHash: daemonDb.getDaemonByApiKeyHash.bind(daemonDb),
        createDaemon: daemonDb.createDaemon.bind(daemonDb),
        updateDaemon: daemonDb.updateDaemon.bind(daemonDb),
        setupDaemon: daemonDb.setupDaemon.bind(daemonDb),
        listDaemonsByRegion: daemonDb.listDaemonsByRegion.bind(daemonDb),
        listSetupIncompleteDaemons: daemonDb.listSetupIncompleteDaemons.bind(daemonDb),

        getIp: ipDb.getIp.bind(ipDb),
        getIpByValue: ipDb.getIpByValue.bind(ipDb),
        listIps: ipDb.listIps.bind(ipDb),

        getRegion: regionDb.getRegion.bind(regionDb),
        createRegion: regionDb.createRegion.bind(regionDb),
        listRegions: regionDb.listRegions.bind(regionDb),

        doesUserExist: userDb.doesUserExist.bind(userDb),
        getUser: userDb.getUser.bind(userDb),
        createUser: userDb.createUser.bind(userDb),
        getUserPermissions: userDb.getUserPermissions.bind(userDb),
        hasUserGotPermissions: userDb.hasUserGotPermissions.bind(userDb)
    }
}