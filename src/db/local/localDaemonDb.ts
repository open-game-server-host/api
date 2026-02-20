import { Daemon, OGSHError } from "@open-game-server-host/backend-lib";
import { generateDaemonApiKey } from "../../daemon/daemon.js";
import { SetupDaemonData, SetupIncompleteDaemon } from "../../interfaces/daemon.js";
import { DATABASE, Database } from "../db.js";
import { LocalDb } from "./localDb.js";

export interface DaemonLocalDbFile {
    api_key_hash: string;
    created_at: number;
    id: string;
    setup_complete: boolean;
    cpu_arch?: string;
    cpu_name?: string;
    ip_id?: string;
    os?: string;
    port_range_start?: number;
    port_range_end?: number;
    region_id?: string;
    segments?: number;
    segments_available?: number;
    sftp_port?: number;
    url?: string;
    ws_url?: string;
}

export class LocalDaemonDb extends LocalDb implements Partial<Database> {
    async getDaemon(id: string): Promise<Daemon> {
        const raw = this.readJsonFile<DaemonLocalDbFile>("daemon", id);
        if (!raw.cpu_arch
            || !raw.cpu_name
            || !raw.ip_id
            || !raw.os
            || !raw.port_range_end
            || !raw.port_range_start
            || !raw.region_id
            || !raw.segments
            || !raw.segments_available
            || !raw.sftp_port
            || !raw.url
            || !raw.ws_url
        ) {
            throw new OGSHError("general/unspecified", `tried to get info for an incomplete daemon '${id}'`);
        }
        return {
            api_key_hash: raw.api_key_hash,
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
            setup_complete: raw.setup_complete,
            sftp_port: raw.sftp_port,
            url: raw.url,
            ws_url: raw.ws_url
        }
    }

    async createDaemon(): Promise<SetupIncompleteDaemon & { api_key: string }> {
        const id = this.createUniqueId("daemon");
        const key = generateDaemonApiKey();
        const data: DaemonLocalDbFile = {
            id,
            api_key_hash: key.hash,
            created_at: Date.now(),
            setup_complete: false
        }
        this.writeJsonFile<DaemonLocalDbFile>("daemon", id, data);
        return {
            id,
            api_key: key.apiKey,
            created_at: data.created_at,
            setup_complete: data.setup_complete
        }
    }

    async setupDaemon(daemonId: string, data: SetupDaemonData): Promise<Daemon> {
        // TODO validate data
        const raw = this.readJsonFile<DaemonLocalDbFile>("daemon", daemonId);
        this.writeJsonFile<DaemonLocalDbFile>("daemon", daemonId, {
            ...raw,
            setup_complete: true,
            ...data
        });
        return this.getDaemon(daemonId);
    }

    async listDaemonsByRegion(regionId: string): Promise<Daemon[]> {
        const daemons: Daemon[] = [];
        for (const id of this.enumerateJsonFiles("daemon")) {
            const daemon = await this.getDaemon(id);
            if (`${daemon.region?.id}` === `${regionId}`) {
                daemons.push(daemon);
            }
        }
        return daemons;
    }

    async listSetupIncompleteDaemons(): Promise<SetupIncompleteDaemon[]> {
        const daemons: SetupIncompleteDaemon[] = [];
        for (const id of this.enumerateJsonFiles("daemon")) {
            const daemon = await this.getDaemon(id);
            if (!daemon.setup_complete) {
                daemons.push(daemon);
            }
        }
        return daemons;
    }
}