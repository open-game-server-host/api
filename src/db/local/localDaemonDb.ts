import { Daemon, DaemonData, OGSHError, RawDaemon } from "@open-game-server-host/backend-lib";
import { SegmentReserveMethod } from "../../daemon/daemon";
import { DaemonDb } from "../daemonDb";
import { DATABASE } from "../db";
import { LocalDb } from "./localDb";

export class LocalDaemonDb extends LocalDb implements DaemonDb {
    constructor() {
        super("daemons");
    }

    async get(id: string): Promise<Daemon> {
        const raw = this.readJsonFile<RawDaemon>(id);
        return {
            cpu_arch: raw.cpu_arch,
            cpu_name: raw.cpu_name,
            created_at: raw.created_at,
            id,
            ip: await DATABASE.ip.get(raw.ip_id),
            os: raw.os,
            port_range_end: raw.port_range_end,
            port_range_start: raw.port_range_start,
            region: await DATABASE.region.get(raw.region_id),
            segments: raw.segments,
            segments_available: raw.segments_available,
            sftp_port: raw.sftp_port,
            url: raw.url,
            ws_url: raw.ws_url
        }
    }

    async create(data: DaemonData): Promise<Daemon> {
        // TODO validate data
        const id = this.createUniqueId();
        this.writeJsonFile<RawDaemon>(id, {
            id,
            ...data
        });
        return this.get(id);
    }

    async reserveSegments(regionId: string, reserveMethod: SegmentReserveMethod, segments: number): Promise<string> {
        switch (reserveMethod) {
            case "fifo":
                // for (const daemon of await this.listByRegion(regionId)) {
                for (const daemon of await this.list()) {
                    if ((daemon.segments_available -= segments) >= 0) {
                        this.writeJsonFile<RawDaemon>(daemon.id, {
                            cpu_arch: daemon.cpu_arch,
                            cpu_name: daemon.cpu_name,
                            created_at: daemon.created_at,
                            id: daemon.id,
                            ip_id: daemon.ip.id,
                            os: daemon.os,
                            port_range_end: daemon.port_range_end,
                            port_range_start: daemon.port_range_start,
                            region_id: daemon.region.id,
                            segments: daemon.segments,
                            segments_available: daemon.segments_available,
                            sftp_port: daemon.sftp_port,
                            url: daemon.url,
                            ws_url: daemon.ws_url
                        });
                        return daemon.id;
                    }
                }
                break;
            case "balanced":
                let selectedDaemon: Daemon | undefined;
                let maxSegmentsAvailable = -1;
                for (const daemon of await this.listByRegion(regionId)) {
                    if (daemon.segments_available > maxSegmentsAvailable) {
                        maxSegmentsAvailable = daemon.segments_available;
                        selectedDaemon = daemon;
                    }
                }
                if (selectedDaemon) {
                    this.writeJsonFile<RawDaemon>(selectedDaemon.id, {
                            cpu_arch: selectedDaemon.cpu_arch,
                            cpu_name: selectedDaemon.cpu_name,
                            created_at: selectedDaemon.created_at,
                            id: selectedDaemon.id,
                            ip_id: selectedDaemon.ip.id,
                            os: selectedDaemon.os,
                            port_range_end: selectedDaemon.port_range_end,
                            port_range_start: selectedDaemon.port_range_start,
                            region_id: selectedDaemon.region.id,
                            segments: selectedDaemon.segments,
                            segments_available: selectedDaemon.segments_available - segments,
                            sftp_port: selectedDaemon.sftp_port,
                            url: selectedDaemon.url,
                            ws_url: selectedDaemon.ws_url
                    });
                    return selectedDaemon.id;
                }
                break;
            default:
                throw new OGSHError("general/unspecified", `invalid daemon segment reserve method '${reserveMethod}'`);
        }
        throw new OGSHError("general/unspecified", `no availability left in region '${regionId}'`);
    }

    async list(): Promise<Daemon[]> {
        const daemons: Daemon[] = [];
        for (const id of this.enumerateJsonFiles()) {
            daemons.push(await this.get(id));
        }
        return daemons;
    }

    async listByRegion(regionId: string): Promise<Daemon[]> {
        const daemons: Daemon[] = [];
        for (const daemon of (await this.list()).filter(daemon => daemon.region.id === regionId)) {
            daemons.push(daemon);
        }
        return daemons;
    }
}