import { Daemon, DaemonData, RawDaemon } from "../../interfaces/daemon";
import { DaemonDb } from "../daemonDb";
import { DATABASE } from "../db";
import { LocalDb } from "./localDb";

export class LocalDaemonDb extends LocalDb implements DaemonDb {
    constructor() {
        super("localdb/daemons");
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
            port_range: await DATABASE.portRange.get(raw.port_range_id),
            region: await DATABASE.region.get(raw.region_id),
            segments: raw.segments,
            segments_used: raw.segments_used,
            sftp_port: raw.sftp_port,
            url: raw.url
        }
    }

    async create(data: DaemonData): Promise<Daemon> {
        const id = this.createUniqueId();
        this.writeJsonFile<RawDaemon>(id, {
            id,
            ...data
        });
        return this.get(id);
    }
}