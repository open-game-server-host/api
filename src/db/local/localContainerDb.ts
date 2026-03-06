import { Container, ContainerPort, ContainerPorts, Daemon, getContainerConfig, getVariant, getVersion, OGSHError, sanitiseDaemon } from "@open-game-server-host/backend-lib";
import { isContainerTerminated } from "../../container/container.js";
import { segmentReserveMethod, SegmentReserveMethod } from "../../daemon/daemon.js";
import { CONTAINER_ALL_PERMISSION, ContainerPermission, CreateContainerData } from "../../interfaces/container.js";
import { DATABASE, Database } from "../db.js";
import { DaemonLocalDbFile } from "./localDaemonDb.js";
import { LocalDb } from "./localDb.js";

export interface ContainerLocalDbFile {
    id: string;
    appId: string;
    contractLengthDays: number;
    createdAt: number;
    daemonId: string;
    free: boolean;
    locked: boolean;
    name: string;
    ports: ContainerPorts;
    runtime: string;
    segments: number;
    terminateAt?: number;
    userId: string;
    users: {
        [userId: string]: ContainerPermission[];
    }
    variantId: string;
    versionId: string;
}

export class LocalContainerDb extends LocalDb implements Partial<Database> {
    async getContainer(id: string): Promise<Container> {
        const raw = this.readJsonFile<ContainerLocalDbFile>("container", id);
        return {
            appId: raw.appId,
            variantId: raw.variantId,
            versionId: raw.versionId,
            contractLengthDays: raw.contractLengthDays,
            createdAt: raw.createdAt,
            daemon: sanitiseDaemon(await DATABASE.getDaemon(raw.daemonId)),
            free: raw.free,
            id,
            locked: raw.locked,
            name: raw.name,
            ports: raw.ports,
            runtime: raw.runtime,
            segments: raw.segments,
            terminateAt: raw.terminateAt,
            userId: raw.userId,
        }
    }

    async getUserContainerPermissions(id: string, userId: string): Promise<ContainerPermission[]> {
        const raw = this.readJsonFile<ContainerLocalDbFile>("container", id);
        return raw.users[userId] || []
    }

    async hasUserGotContainerPermissions(containerId: string, userId: string, ...permissions: ContainerPermission[]): Promise<boolean> {
        const userPerms = await this.getUserContainerPermissions(containerId, userId);
        if (userPerms.includes(CONTAINER_ALL_PERMISSION)) {
            return true;
        }
        for (const permission of permissions) {
            if (!userPerms.includes(permission)) {
                return false;
            }
        }
        return false;
    }

    private async reserveSegments(regionId: string, reserveMethod: SegmentReserveMethod, segments: number): Promise<Daemon> {
        switch (reserveMethod) {
            case "fifo":
                for (const daemon of await DATABASE.listDaemonsByRegion(regionId)) {
                    if ((daemon.segmentsAvailable! -= segments) >= 0) {
                        this.writeJsonFile<DaemonLocalDbFile>("daemon", daemon.id, {
                            apiKeyHash: daemon.apiKeyHash,
                            cpuArch: daemon.cpuArch,
                            cpuName: daemon.cpuName,
                            createdAt: daemon.createdAt,
                            enabled: daemon.enabled,
                            id: daemon.id,
                            ip_ids: daemon.ips.map(i => i.id),
                            os: daemon.os,
                            portRangeStart: daemon.portRangeStart,
                            portRangeEnd: daemon.portRangeEnd,
                            regionId: daemon.region!.id,
                            segmentsUsable: daemon.segmentsUsable,
                            segmentsAvailable: daemon.segmentsAvailable,
                            setupComplete: daemon.setupComplete
                        });
                        return daemon;
                    }
                }
                break;
            case "balanced":
                let selectedDaemon: Daemon | undefined;
                let maxSegmentsAvailable = -1;
                for (const daemon of await DATABASE.listDaemonsByRegion(regionId)) {
                    if (daemon.segmentsAvailable! > maxSegmentsAvailable) {
                        maxSegmentsAvailable = daemon.segmentsAvailable!;
                        selectedDaemon = daemon;
                    }
                }
                if (selectedDaemon) {
                    this.writeJsonFile<DaemonLocalDbFile>("daemon", selectedDaemon.id, {
                            apiKeyHash: selectedDaemon.apiKeyHash,
                            cpuArch: selectedDaemon.cpuArch,
                            cpuName: selectedDaemon.cpuName,
                            createdAt: selectedDaemon.createdAt,
                            enabled: selectedDaemon.enabled,
                            id: selectedDaemon.id,
                            ip_ids: selectedDaemon.ips.map(i => i.id),
                            os: selectedDaemon.os,
                            portRangeStart: selectedDaemon.portRangeStart,
                            portRangeEnd: selectedDaemon.portRangeEnd,
                            regionId: selectedDaemon.region!.id,
                            segmentsUsable: selectedDaemon.segmentsUsable,
                            segmentsAvailable: selectedDaemon.segmentsAvailable! - segments,
                            setupComplete: selectedDaemon.setupComplete
                    });
                    return selectedDaemon;
                }
                break;
            default:
                throw new OGSHError("general/unspecified", `invalid daemon segment reserve method '${reserveMethod}'`);
        }
        throw new OGSHError("general/unspecified", `no availability left in region '${regionId}'`);
    }

    async createContainer(data: CreateContainerData): Promise<Container> {
        const version = await getVersion(data.appId, data.variantId, data.versionId);
        if (!version) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid app id '${data.appId}' variant id '${data.variantId}' version id '${data.versionId}'`);
        }
        if (!Number.isInteger(data.segments)) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid segments '${data.segments}'`);
        }
        if (typeof data.free !== "boolean") throw new OGSHError("general/unspecified", `create container data 'free' field was not a boolean`);
        const containerConfig = await getContainerConfig();
        if (typeof data.name !== "string" || data.name.length > containerConfig.nameMaxLength) throw new OGSHError("general/unspecified", `create container data 'name' is either not a string or too long`);
        if (!this.jsonFileExists("user", data.userId)) throw new OGSHError("general/unspecified", `user id '${data.userId}' not found`);
        if (!this.jsonFileExists("region", data.regionId)) throw new OGSHError("general/unspecified", `region id '${data.regionId}' not found`);

        const daemon = await this.reserveSegments(data.regionId, segmentReserveMethod, data.segments);

        const variant = await getVariant(data.appId, data.variantId);
        const ports: ContainerPorts = {};

        if (daemon.portRangeStart && daemon.portRangeEnd) {
            function assignPorts(rangeStart: number, rangeEnd: number, portsInUse: number[]): ContainerPort[] {
                const ports: ContainerPort[] = [];
                const range = rangeEnd - rangeStart;
                for (const containerPort of Object.keys(variant?.ports || {})) {
                    let newHostPort: number;
                    do {
                        newHostPort = rangeStart + Math.floor(Math.random() * range);
                    } while (portsInUse.includes(newHostPort));
                    ports.push({
                        containerPort: +containerPort,
                        hostPort: newHostPort
                    });
                }
                return ports;
            }
            for (const container of await this.listActiveContainersByDaemon(daemon.id)) {
                Object.entries(container.ports).forEach(([ipVersion, assignedPorts]) => {
                    ports[+ipVersion] = assignPorts(daemon.portRangeStart!, daemon.portRangeEnd!, (assignedPorts as {hostPort: number}[]).map(p => p.hostPort))
                });
            }
        }

        const id = this.createUniqueId("container");
        this.writeJsonFile<ContainerLocalDbFile>("container", id, {
            id,
            appId: data.appId,
            variantId: data.variantId,
            versionId: data.versionId,
            free: data.free,
            name: data.name,
            runtime: version.defaultRuntime,
            segments: data.segments,
            userId: data.userId,
            contractLengthDays: 30, // TODO this should be defined by the plan the user selects at checkout
            createdAt: Date.now(),
            daemonId: daemon.id,
            locked: false,
            ports,
            users: {
                [data.userId]: [
                    CONTAINER_ALL_PERMISSION
                ]
            }
        });

        return this.getContainer(id);
    }

    async terminateContainer(containerId: string, terminateAt: Date) {
        const container = await this.getContainer(containerId);
        if (terminateAt.getTime() < Date.now()) {
            throw new OGSHError("general/unspecified", `container id '${containerId}' termination date must be in the future`);
        }
        this.writeJsonFile<ContainerLocalDbFile>("container", containerId, {
            appId: container.appId,
            contractLengthDays: container.contractLengthDays,
            createdAt: container.createdAt,
            daemonId: container.daemon.id,
            free: container.free,
            id: containerId,
            ports: container.ports,
            locked: container.locked,
            name: container.name,
            runtime: container.runtime,
            segments: container.segments,
            userId: container.userId,
            users: {},
            variantId: container.variantId,
            versionId: container.versionId,
            terminateAt: +terminateAt
        });
    }

    async cancelTerminateContainer(containerId: string) {
        const now = Date.now();
        const raw = this.readJsonFile<ContainerLocalDbFile>("container", containerId);
        if (!raw.terminateAt) throw new OGSHError("general/unspecified", `container id '${containerId}' has no termination date`);
        if (raw.terminateAt < now) throw new OGSHError("general/unspecified", `container id '${containerId}' termination date is in the past`);
        raw.terminateAt = undefined;
        this.writeJsonFile("container", containerId, raw);
    }

    async listActiveContainersByDaemon(daemonId: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<ContainerLocalDbFile>("container")
        .filter(c => c.data.daemonId === daemonId)
        .filter(c => !isContainerTerminated(c.data))) {
            containers.push(await this.getContainer(raw.id));
        }
        return containers;
    }

    async listActiveContainersByUser(uid: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<ContainerLocalDbFile>("container")
        .filter(c => c.data.userId === uid)
        .filter(c => !isContainerTerminated(c.data))) {
            containers.push(await this.getContainer(raw.id));
        }
        return containers;
    }

    async setContainerName(containerId: string, name: string) {
        if (!name) throw new OGSHError("general/unspecified", `container id '${containerId}' new name is undefined`);
        const containerConfig = await getContainerConfig();
        if (name.length > containerConfig.nameMaxLength) throw new OGSHError("general/unspecified", `container id '' new name length > max length ${containerConfig.nameMaxLength}`);
        const raw = this.readJsonFile<ContainerLocalDbFile>("container", containerId);
        raw.name = name;
        this.writeJsonFile("container", containerId, raw);
    }

    async setContainerRuntime(containerId: string, runtime: string) {
        const raw = this.readJsonFile<ContainerLocalDbFile>("container", containerId);
        raw.runtime = runtime;
        this.writeJsonFile("container", containerId, raw);
    }

    async setContainerApp(containerId: string, appId: string, variantId: string, versionId: string) {
        const raw = this.readJsonFile<ContainerLocalDbFile>("container", containerId);
        raw.appId = appId;
        raw.variantId = variantId;
        raw.versionId = versionId;
        this.writeJsonFile("container", containerId, raw);
    }
}