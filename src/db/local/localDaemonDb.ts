import { Daemon, DaemonData, RawDaemon } from "@open-game-server-host/backend-lib";
import { DATABASE, Database } from "../db";
import { LocalDb } from "./localDb";

export class LocalDaemonDb extends LocalDb implements Partial<Database> {
    async getDaemon(id: string): Promise<Daemon> {
        const raw = this.readJsonFile<RawDaemon>("daemon", id);
        return {
            cpu_arch: raw.cpu_arch,
            cpu_name: raw.cpu_name,
            created_at: raw.created_at,
            id,
            ip: await DATABASE.getIp(raw.ip_id),
            os: raw.os,
            port_range_end: raw.port_range_end,
            port_range_start: raw.port_range_start,
            region: await DATABASE.getRegion(raw.region_id),
            segments: raw.segments,
            segments_available: raw.segments_available,
            sftp_port: raw.sftp_port,
            url: raw.url,
            ws_url: raw.ws_url
        }
    }

    async createDaemon(data: DaemonData): Promise<Daemon> {
        // TODO validate data
        const id = this.createUniqueId("daemon");
        this.writeJsonFile<RawDaemon>("daemon", id, {
            id,
            ...data
        });
        return this.getDaemon(id);
    }

    async listDaemonsByRegion(regionId: string): Promise<Daemon[]> {
        const daemons: Daemon[] = [];
        for (const id of this.enumerateJsonFiles("daemon")) {
            const daemon = await this.getDaemon(id);
            if (`${daemon.region.id}` === `${regionId}`) {
                daemons.push(daemon);
            }
        }
        return daemons;
    }
}