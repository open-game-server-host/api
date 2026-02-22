import { Container, ContainerPort, Daemon, getVariant, getVersion, OGSHError } from "@open-game-server-host/backend-lib";
import { isContainerTerminated } from "../../container/container.js";
import { segmentReserveMethod, SegmentReserveMethod } from "../../daemon/daemon.js";
import { CreateContainerData } from "../../interfaces/container.js";
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
    ipv4Ports: ContainerPort[];
    ipv6Ports: ContainerPort[];
    runtime: string;
    segments: number;
    terminateAt?: number;
    userId: string;
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
            daemon: await DATABASE.getDaemon(raw.daemonId),
            free: raw.free,
            id,
            locked: raw.locked,
            name: raw.name,
            ipv4Ports: raw.ipv4Ports,
            ipv6Ports: raw.ipv6Ports,
            runtime: raw.runtime,
            segments: raw.segments,
            terminateAt: raw.terminateAt,
            userId: raw.userId,
        }
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
                            id: daemon.id,
                            ipv4Id: daemon.ipv4?.id,
                            ipv6Id: daemon.ipv6?.id,
                            os: daemon.os,
                            ipv4PortRangeStart: daemon.ipv4PortRangeStart,
                            ipv4PortRangeEnd: daemon.ipv4PortRangeEnd,
                            ipv6PortRangeStart: daemon.ipv6PortRangeStart,
                            ipv6PortRangeEnd: daemon.ipv6PortRangeEnd,
                            regionId: daemon.region!.id,
                            segments: daemon.segments,
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
                            id: selectedDaemon.id,
                            ipv4Id: selectedDaemon.ipv4?.id,
                            ipv6Id: selectedDaemon.ipv6?.id,
                            os: selectedDaemon.os,
                            ipv4PortRangeStart: selectedDaemon.ipv4PortRangeStart,
                            ipv4PortRangeEnd: selectedDaemon.ipv4PortRangeEnd,
                            ipv6PortRangeStart: selectedDaemon.ipv6PortRangeStart,
                            ipv6PortRangeEnd: selectedDaemon.ipv6PortRangeEnd,
                            regionId: selectedDaemon.region!.id,
                            segments: selectedDaemon.segments,
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
        if (!await DATABASE.doesUserExist(data.userId)) {
            
        }

        const version = await getVersion(data.appId, data.variantId, data.versionId);
        if (!version) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid app id '${data.appId}' variant id '${data.variantId}' version id '${data.versionId}'`);
        }
        if (!Number.isInteger(data.segments)) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid segments '${data.segments}'`);
        }
        // TODO validate container data

        const daemon = await this.reserveSegments(data.regionId, segmentReserveMethod, data.segments);

        const variant = await getVariant(data.appId, data.variantId);
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
        const ipv4PortsInUse: number[] = [];
        const ipv6PortsInuse: number[] = [];
        for (const container of await this.listActiveContainersByDaemon(daemon.id)) {
            container.ipv4Ports.forEach(ports => ipv4PortsInUse.push(ports.hostPort));
            container.ipv6Ports.forEach(ports => ipv6PortsInuse.push(ports.hostPort));
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
            ipv4Ports: (daemon.ipv4PortRangeStart && daemon.ipv4PortRangeEnd) ? assignPorts(daemon.ipv4PortRangeStart, daemon.ipv4PortRangeEnd, ipv4PortsInUse) : [],
            ipv6Ports: (daemon.ipv6PortRangeStart && daemon.ipv6PortRangeEnd) ? assignPorts(daemon.ipv6PortRangeStart, daemon.ipv6PortRangeEnd, ipv6PortsInuse) : []
        });

        return this.getContainer(id);
    }

    async terminateContainer(id: string): Promise<Container> {
        const container = await this.getContainer(id);
        const now = Date.now();
        const remainingTime = (now - container.createdAt) / (container.contractLengthDays * 86_400_000);
        this.writeJsonFile<ContainerLocalDbFile>("container", id, {
            appId: container.appId,
            contractLengthDays: container.contractLengthDays,
            createdAt: container.createdAt,
            daemonId: container.daemon.id,
            free: container.free,
            id,
            ipv4Ports: container.ipv4Ports,
            ipv6Ports: container.ipv6Ports,
            locked: container.locked,
            name: container.name,
            runtime: container.runtime,
            segments: container.segments,
            userId: container.userId,
            variantId: container.variantId,
            versionId: container.versionId,
            terminateAt: now + remainingTime
        });
        return container;
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
}