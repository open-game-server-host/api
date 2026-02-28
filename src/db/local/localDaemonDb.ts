import { Daemon, Ip, OGSHError } from "@open-game-server-host/backend-lib";
import { generateDaemonApiKey } from "../../daemon/daemon.js";
import { SetupDaemonData, SetupIncompleteDaemon } from "../../interfaces/daemon.js";
import { DATABASE, Database } from "../db.js";
import { LocalDb } from "./localDb.js";

export interface DaemonLocalDbFile {
    apiKeyHash: string;
    createdAt: number;
    id: string;
    setupComplete: boolean;
    cpuArch?: string;
    cpuName?: string;
    ipv4Id?: string;
    ipv6Id?: string;
    os?: string;
    ipv4PortRangeStart?: number;
    ipv4PortRangeEnd?: number;
    ipv6PortRangeStart?: number;
    ipv6PortRangeEnd?: number;
    regionId?: string;
    segments?: number;
    segmentsAvailable?: number;
    sftpPort?: number;
}

export class LocalDaemonDb extends LocalDb implements Partial<Database> {
    async getDaemon(id: string): Promise<Daemon> {
        const raw = this.readJsonFile<DaemonLocalDbFile>("daemon", id);
        if (!raw.setupComplete) {
            throw new OGSHError("general/unspecified", `tried to get info for an incomplete daemon '${id}'`);
        }
        return {
            apiKeyHash: raw.apiKeyHash,
            cpuArch: raw.cpuArch!,
            cpuName: raw.cpuName!,
            createdAt: raw.createdAt,
            id,
            ipv4: raw.ipv4Id ? await DATABASE.getIpv4(raw.ipv4Id) : undefined,
            ipv6: raw.ipv6Id ? await DATABASE.getIpv6(raw.ipv6Id) : undefined,
            os: raw.os!,
            ipv4PortRangeStart: raw.ipv4PortRangeStart,
            ipv4PortRangeEnd: raw.ipv4PortRangeEnd,
            ipv6PortRangeStart: raw.ipv6PortRangeStart,
            ipv6PortRangeEnd: raw.ipv6PortRangeEnd,
            region: await DATABASE.getRegion(raw.regionId!),
            segments: raw.segments!,
            segmentsAvailable: raw.segmentsAvailable!,
            setupComplete: raw.setupComplete
        }
    }

    async getDaemonByApiKeyHash(apiKeyHash: string): Promise<Daemon | SetupIncompleteDaemon> {
        for (const daemon of this.listJsonFiles<DaemonLocalDbFile>("daemon")) {
            if (daemon.data.apiKeyHash === apiKeyHash) {
                if (daemon.data.setupComplete) {
                    return this.getDaemon(daemon.id);
                } else {
                    const incomplete: SetupIncompleteDaemon = {
                        apiKeyHash: daemon.data.apiKeyHash,
                        createdAt: daemon.data.createdAt,
                        id: daemon.id,
                        setupComplete: false
                    }
                    return incomplete;
                }
            }
        }
        throw new OGSHError("general/unspecified", `no daemon found with provided api key hash`);
    }

    async createDaemon(): Promise<SetupIncompleteDaemon & { apiKey: string }> {
        const id = this.createUniqueId("daemon");
        const key = generateDaemonApiKey();
        const data: DaemonLocalDbFile = {
            id,
            apiKeyHash: key.hash,
            createdAt: Date.now(),
            setupComplete: false
        }
        this.writeJsonFile<DaemonLocalDbFile>("daemon", id, data);
        return {
            id,
            apiKey: key.apiKey,
            apiKeyHash: key.hash,
            createdAt: data.createdAt,
            setupComplete: data.setupComplete
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
            setupComplete: true,
            cpuArch: data.cpuArch,
            cpuName: data.cpuName,
            ipv4Id: ipv4Id,
            ipv6Id: ipv6Id,
            os: data.os,
            ipv4PortRangeStart: data.ipv4PortRangeStart,
            ipv4PortRangeEnd: data.ipv4PortRangeEnd,
            ipv6PortRangeStart: data.ipv6PortRangeStart,
            ipv6PortRangeEnd: data.ipv6PortRangeEnd,
            regionId: data.regionId,
            segments: data.segments,
            segmentsAvailable: data.segments
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
            if (!daemon.setupComplete) {
                daemons.push(daemon);
            }
        }
        return daemons;
    }
}