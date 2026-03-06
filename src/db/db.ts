import { Container, Daemon, getContainerConfig, getVersion, Ip, OGSHError, Region, UpdateDaemonData, User } from "@open-game-server-host/backend-lib";
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
    cancelTerminateContainer(containerId: string): Promise<void>;
    listActiveContainersByUser(authUid: string, page?: number, resultsPerPage?: number): Promise<Container[]>;
    listActiveContainersByDaemon(daemonId: string, page?: number, resultsPerPage?: number): Promise<Container[]>;
    setContainerName(containerId: string, name: string): Promise<void>;
    setContainerRuntime(containerId: string, runtime: string): Promise<void>;
    setContainerApp(containerId: string, appId: string, variantId: string, versionId: string): Promise<void>;

    getDaemon(daemonId: string): Promise<Daemon>;
    getDaemonByApiKeyHash(apiKeyHash: string): Promise<Daemon | SetupIncompleteDaemon>;
    createDaemon(): Promise<string>; // Returns API key
    updateDaemon(daemonId: string, data: UpdateDaemonData): Promise<void>;
    setupDaemon(daemonId: string, data: SetupDaemonData): Promise<void>;
    listDaemonsByRegion(regionId: string, page?: number, resultsPerPage?: number): Promise<Daemon[]>;
    listSetupIncompleteDaemons(page?: number, resultsPerPage?: number): Promise<SetupIncompleteDaemon[]>;

    getIp(ipId: string): Promise<Ip>;
    getIpByValue(ip: string): Promise<Ip>;
    listIps(page?: number, resultsPerPage?: number): Promise<Ip[]>;

    getRegion(regionId: string): Promise<Region>;
    createRegion(data: CreateRegionData): Promise<Region>;
    listRegions(page?: number, resultsPerPage?: number): Promise<Region[]>;

    doesUserExist(userId: string): Promise<boolean>;
    getUser(authUid: string): Promise<User>;
    createUser(authUid: string): Promise<User>;
    getUserPermissions(userId: string): Promise<UserPermission[]>;
    hasUserGotPermissions(userId: string, permissions: UserPermission[]): Promise<boolean>;
}

const dbFunctions = createDb();
export const DATABASE: Database = {
    ...dbFunctions,
    createContainer: async (data: CreateContainerData) => {
        const version = await getVersion(data.appId, data.variantId, data.versionId);
        if (!version) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid app id '${data.appId}' variant id '${data.variantId}' version id '${data.versionId}'`);
        }
        if (!version.defaultRuntime) {
            throw new OGSHError("general/unspecified", `app id '${data.appId}' variant id '${data.variantId}' version id '${data.versionId}' has no default runtime`);
        }
        if (!Number.isInteger(data.segments)) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid segments '${data.segments}'`);
        }
        if (typeof data.free !== "boolean") {
            throw new OGSHError("general/unspecified", `create container data 'free' field was not a boolean`);
        }
        const containerConfig = await getContainerConfig();
        if (typeof data.name !== "string" || data.name.length > containerConfig.nameMaxLength) {
            throw new OGSHError("general/unspecified", `create container data 'name' is either not a string or too long`);
        }
        return dbFunctions.createContainer(data);
    },
    terminateContainer: async (containerId: string, terminateAt: Date) => {
        if (!terminateAt || !(terminateAt instanceof Date)) {
            throw new OGSHError("general/unspecified", `failed to terminate container id '${containerId}', terminateAt is not a Date`);
        }
        if (terminateAt.getTime() < Date.now()) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' termination date must be in the future`);
        }
        return dbFunctions.terminateContainer(containerId, terminateAt);
    },
    setContainerName: async (containerId: string, name: string) => {
        const containerConfig = await getContainerConfig();
        if (!name || name.length > containerConfig.nameMaxLength) {
            throw new OGSHError("general/unspecified", `could not set name of container id '${containerId}', name either undefined or above max length (${containerConfig.nameMaxLength}})`);
        }
        return dbFunctions.setContainerName(containerId, name);
    },
    setContainerApp: async (containerId, appId, variantId, versionId) => {
        const version = await getVersion(appId, variantId, versionId);
        if (!version) {
            throw new OGSHError("app/version-not-found", `could not change container id '${containerId}' to app id '${appId}' variant id '${variantId}' version id '${versionId}'`);
        }
        return dbFunctions.setContainerApp(containerId, appId, variantId, versionId);
    },
    updateDaemon: async (daemonId: string, data: UpdateDaemonData) => {
        if (typeof data.cpuArch !== "string" || data.cpuArch.length > 10) {
            throw new OGSHError("general/unspecified", `updating daemon id '${daemonId}' cpuArch either not a string or too long`);
        }
        if (typeof data.cpuName !== "string" || data.cpuName.length > 30) {
            throw new OGSHError("general/unspecified", `updating daemon id '${daemonId}' cpuName either not a string or too long`);
        }
        if (data.os !== "linux" && data.os !== "win32") {
            throw new OGSHError("general/unspecified", `updating daemon id '${daemonId}' invalid os '${data.os}'`);
        }
        if (!data.segmentsMax || !Number.isInteger(data.segmentsMax) || data.segmentsMax < 0) {
            throw new OGSHError("general/unspecified", `updating dameon '${daemonId}' segmentsMax either not an integer or < 0`);
        }
        return dbFunctions.updateDaemon(daemonId, data);
    },
    setupDaemon: async (daemonId: string, data: SetupDaemonData) => {
        if (!data.portRangeStart || !Number.isInteger(data.portRangeStart) || data.portRangeStart < 1024) {
            throw new OGSHError("general/unspecified", `setup daemon id '${daemonId}' portRangeStart either not an integer or < 1024`);
        }
        if (!data.portRangeEnd || !Number.isInteger(data.portRangeEnd) || data.portRangeEnd < data.portRangeStart) {
            throw new OGSHError("general/unspecified", `setup daemon id '${daemonId}' portRangeEnd either not an integer or < portRangeStart (${data.portRangeStart})`);
        }
        if (!data.segmentsUsable || !Number.isInteger(data.segmentsUsable)) {
            throw new OGSHError("general/unspecified", `setup daemon id '${daemonId}' segmentsUsable is not an integer`);
        }
        return dbFunctions.setupDaemon(daemonId, data);
    },
    createRegion: async (data: CreateRegionData) => {
        if (typeof data.countryCode !== "string" || data.countryCode.length > 3) {
            throw new OGSHError("general/unspecified", `failed to create region, countryCode is undefined or longer than 3 characters`);
        }
        if (typeof data.name !== "string" || data.name.length > 45) {
            throw new OGSHError("general/unspecified", `failed to create region, name is undefined or longer than 45 characters`);
        }
        if (data.priceMultiplier < 0) {
            throw new OGSHError("general/unspecified", `failed to create region, priceMultiplier < 0`);
        }
        return dbFunctions.createRegion(data);
    }
}

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
        cancelTerminateContainer: containerDb.cancelTerminateContainer.bind(containerDb),
        listActiveContainersByDaemon: containerDb.listActiveContainersByDaemon.bind(containerDb),
        listActiveContainersByUser: containerDb.listActiveContainersByUser.bind(containerDb),
        setContainerName: containerDb.setContainerName.bind(containerDb),
        setContainerRuntime: containerDb.setContainerRuntime.bind(containerDb),
        setContainerApp: containerDb.setContainerApp.bind(containerDb),
        
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
        cancelTerminateContainer: containerDb.cancelTerminateContainer.bind(containerDb),
        listActiveContainersByDaemon: containerDb.listActiveContainersByDaemon.bind(containerDb),
        listActiveContainersByUser: containerDb.listActiveContainersByUser.bind(containerDb),
        setContainerName: containerDb.setContainerName.bind(containerDb),
        setContainerRuntime: containerDb.setContainerRuntime.bind(containerDb),
        setContainerApp: containerDb.setContainerApp.bind(containerDb),
        
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