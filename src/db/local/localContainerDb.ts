import { Container, ContainerPort, Daemon, getVariant, getVersion, OGSHError } from "@open-game-server-host/backend-lib";
import { isContainerTerminated } from "../../container/container.js";
import { segmentReserveMethod, SegmentReserveMethod } from "../../daemon/daemon.js";
import { CreateContainerData } from "../../interfaces/container.js";
import { DATABASE, Database } from "../db.js";
import { DaemonLocalDbFile } from "./localDaemonDb.js";
import { LocalDb } from "./localDb.js";

export interface ContainerLocalDbFile {
    id: string;
    app_id: string;
    contract_length_days: number;
    created_at: number;
    daemon_id: string;
    free: boolean;
    locked: boolean;
    name: string;
    ports: ContainerPort[];
    runtime: string;
    segments: number;
    terminate_at?: number;
    user_id: string;
    variant_id: string;
    version_id: string;
}

export class LocalContainerDb extends LocalDb implements Partial<Database> {
    async getContainer(id: string): Promise<Container> {
        const raw = this.readJsonFile<ContainerLocalDbFile>("container", id);
        return {
            app_id: raw.app_id,
            variant_id: raw.variant_id,
            version_id: raw.version_id,
            contract_length_days: raw.contract_length_days,
            created_at: raw.created_at,
            daemon: await DATABASE.getDaemon(raw.daemon_id),
            free: raw.free,
            id,
            locked: raw.locked,
            name: raw.name,
            ports: raw.ports,
            runtime: raw.runtime,
            segments: raw.segments,
            terminate_at: raw.terminate_at,
            user_id: raw.user_id,
        }
    }

    private async reserveSegments(regionId: string, reserveMethod: SegmentReserveMethod, segments: number): Promise<Daemon> {
        switch (reserveMethod) {
            case "fifo":
                for (const daemon of await DATABASE.listDaemonsByRegion(regionId)) {
                    if ((daemon.segments_available! -= segments) >= 0) {
                        this.writeJsonFile<DaemonLocalDbFile>("daemon", daemon.id, {
                            api_key_hash: daemon.api_key_hash,
                            cpu_arch: daemon.cpu_arch,
                            cpu_name: daemon.cpu_name,
                            created_at: daemon.created_at,
                            id: daemon.id,
                            ip_id: daemon.ip!.id,
                            os: daemon.os,
                            port_range_end: daemon.port_range_end,
                            port_range_start: daemon.port_range_start,
                            region_id: daemon.region!.id,
                            segments: daemon.segments,
                            segments_available: daemon.segments_available,
                            setup_complete: daemon.setup_complete,
                            sftp_port: daemon.sftp_port,
                            url: daemon.url,
                            ws_url: daemon.ws_url,
                        });
                        return daemon;
                    }
                }
                break;
            case "balanced":
                let selectedDaemon: Daemon | undefined;
                let maxSegmentsAvailable = -1;
                for (const daemon of await DATABASE.listDaemonsByRegion(regionId)) {
                    if (daemon.segments_available! > maxSegmentsAvailable) {
                        maxSegmentsAvailable = daemon.segments_available!;
                        selectedDaemon = daemon;
                    }
                }
                if (selectedDaemon) {
                    this.writeJsonFile<DaemonLocalDbFile>("daemon", selectedDaemon.id, {
                            api_key_hash: selectedDaemon.api_key_hash,
                            cpu_arch: selectedDaemon.cpu_arch,
                            cpu_name: selectedDaemon.cpu_name,
                            created_at: selectedDaemon.created_at,
                            id: selectedDaemon.id,
                            ip_id: selectedDaemon.ip!.id,
                            os: selectedDaemon.os,
                            port_range_end: selectedDaemon.port_range_end,
                            port_range_start: selectedDaemon.port_range_start,
                            region_id: selectedDaemon.region!.id,
                            segments: selectedDaemon.segments,
                            segments_available: selectedDaemon.segments_available! - segments,
                            setup_complete: selectedDaemon.setup_complete,
                            sftp_port: selectedDaemon.sftp_port,
                            url: selectedDaemon.url,
                            ws_url: selectedDaemon.ws_url
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
        if (!await DATABASE.doesUserExist(data.user_id)) {
            
        }

        const version = await getVersion(data.app_id, data.variant_id, data.version_id);
        if (!version) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid app id '${data.app_id}' variant id '${data.variant_id}' version id '${data.version_id}'`);
        }
        if (!Number.isInteger(data.segments)) {
            throw new OGSHError("general/unspecified", `tried to create container with invalid segments '${data.segments}'`);
        }
        // TODO validate container data

        const daemon = await this.reserveSegments(data.region_id, segmentReserveMethod, data.segments);

        const variant = await getVariant(data.app_id, data.variant_id);
        const ports: ContainerPort[] = [];
        const portsInUse: number[] = [];
        for (const container of await this.listActiveContainersByDaemon(daemon.id)) {
            container.ports.forEach(ports => portsInUse.push(ports.host_port));
        }
        const range = daemon.port_range_end! - daemon.port_range_start!;
        for (const containerPort of Object.keys(variant?.ports || {})) {
            let newHostPort: number;
            do {
                newHostPort = daemon.port_range_start + Math.floor(Math.random() * range);
            } while (portsInUse.includes(newHostPort));
            ports.push({
                container_port: +containerPort,
                host_port: newHostPort
            });
        }

        const id = this.createUniqueId("container");
        this.writeJsonFile<ContainerLocalDbFile>("container", id, {
            id,
            app_id: data.app_id,
            variant_id: data.variant_id,
            version_id: data.version_id,
            free: data.free,
            name: data.name,
            runtime: version.default_runtime,
            segments: data.segments,
            user_id: data.user_id,
            contract_length_days: 30, // TODO this should be defined by the plan the user selects at checkout
            created_at: Date.now(),
            daemon_id: daemon.id,
            locked: false,
            ports
        });

        return this.getContainer(id);
    }

    async terminateContainer(id: string): Promise<Container> {
        const container = await this.getContainer(id);
        const now = Date.now();
        const remainingTime = (now - container.created_at) / (container.contract_length_days * 86_400_000);
        this.writeJsonFile<ContainerLocalDbFile>("container", id, {
            app_id: container.app_id,
            contract_length_days: container.contract_length_days,
            created_at: container.created_at,
            daemon_id: container.daemon.id,
            free: container.free,
            id,
            locked: container.locked,
            name: container.name,
            ports: container.ports,
            runtime: container.runtime,
            segments: container.segments,
            user_id: container.user_id,
            variant_id: container.variant_id,
            version_id: container.version_id,
            terminate_at: now + remainingTime
        });
        return container;
    }

    async listActiveContainersByDaemon(daemonId: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<ContainerLocalDbFile>("container")
        .filter(c => c.data.daemon_id === daemonId)
        .filter(c => !isContainerTerminated(c.data))) {
            containers.push(await this.getContainer(raw.id));
        }
        return containers;
    }

    async listActiveContainersByUser(uid: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<ContainerLocalDbFile>("container")
        .filter(c => c.data.user_id === uid)
        .filter(c => !isContainerTerminated(c.data))) {
            containers.push(await this.getContainer(raw.id));
        }
        return containers;
    }
}