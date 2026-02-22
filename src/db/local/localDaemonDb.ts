import { Daemon, Ip, OGSHError } from "@open-game-server-host/backend-lib";
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
    ipv4_id?: string;
    ipv6_id?: string;
    os?: string;
    ipv4_port_range_start?: number;
    ipv4_port_range_end?: number;
    ipv6_port_range_start?: number;
    ipv6_port_range_end?: number;
    region_id?: string;
    segments?: number;
    segments_available?: number;
    sftp_port?: number;
}

export class LocalDaemonDb extends LocalDb implements Partial<Database> {
    async getDaemon(id: string): Promise<Daemon> {
        const raw = this.readJsonFile<DaemonLocalDbFile>("daemon", id);
        if (!raw.setup_complete) {
            throw new OGSHError("general/unspecified", `tried to get info for an incomplete daemon '${id}'`);
        }
        return {
            api_key_hash: raw.api_key_hash,
            cpu_arch: raw.cpu_arch!,
            cpu_name: raw.cpu_name!,
            created_at: raw.created_at,
            id,
            ipv4: raw.ipv4_id ? await DATABASE.getIpv4(raw.ipv4_id) : undefined,
            ipv6: raw.ipv6_id ? await DATABASE.getIpv6(raw.ipv6_id) : undefined,
            os: raw.os!,
            ipv4_port_range_start: raw.ipv4_port_range_start,
            ipv4_port_range_end: raw.ipv4_port_range_end,
            ipv6_port_range_start: raw.ipv6_port_range_start,
            ipv6_port_range_end: raw.ipv6_port_range_end,
            region: await DATABASE.getRegion(raw.region_id!),
            segments: raw.segments!,
            segments_available: raw.segments_available!,
            setup_complete: raw.setup_complete,
            sftp_port: raw.sftp_port!
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
        if (!data.ipv4 && !data.ipv6) {
            throw new OGSHError("general/unspecified", `must specify 'ipv4' or 'ipv6' when setting up a daemon`);
        }
        let ipv4Id: string | undefined;
        let ipv6Id: string | undefined;
        if (data.ipv4) {
            // TODO validate ipv4
            try {
                ipv4Id = (await DATABASE.getIpv4ByIp(data.ipv4)).id;
            } catch (error) {
                ipv4Id = this.createUniqueId("ipv4");
                this.writeJsonFile<Ip>("ipv4", ipv4Id, {
                    id: ipv4Id,
                    ip: data.ipv4
                });
            }
        }
        if (data.ipv6) {
            // TODO validate ipv6
            try {
                ipv6Id = (await DATABASE.getIpv6ByIp(data.ipv6)).id;
            } catch (error) {
                ipv6Id = this.createUniqueId("ipv6");
                this.writeJsonFile<Ip>("ipv6", ipv6Id, {
                    id: ipv6Id,
                    ip: data.ipv6
                });
            }
        }
        const raw = this.readJsonFile<DaemonLocalDbFile>("daemon", daemonId);
        this.writeJsonFile<DaemonLocalDbFile>("daemon", daemonId, {
            ...raw,
            setup_complete: true,
            cpu_arch: data.cpu_arch,
            cpu_name: data.cpu_name,
            ipv4_id: ipv4Id,
            ipv6_id: ipv6Id,
            os: data.os,
            ipv4_port_range_start: data.ipv4_port_range_start,
            ipv4_port_range_end: data.ipv4_port_range_end,
            ipv6_port_range_start: data.ipv6_port_range_start,
            ipv6_port_range_end: data.ipv6_port_range_end,
            region_id: data.region_id,
            segments: data.segments,
            segments_available: data.segments,
            sftp_port: data.sftp_port
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