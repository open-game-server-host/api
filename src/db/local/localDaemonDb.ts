import { Daemon, OGSHError, UpdateDaemonData } from "@open-game-server-host/backend-lib";
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
    portRangeStart?: number;
    portRangeEnd?: number;
    regionId?: string;
    segments?: number;
    segmentsAvailable?: number;
    segmentsMax?: number;
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
            portRangeStart: raw.portRangeStart,
            portRangeEnd: raw.portRangeEnd,
            region: await DATABASE.getRegion(raw.regionId!),
            segments: raw.segments!,
            segmentsAvailable: raw.segmentsAvailable!,
            segmentsMax: raw.segmentsMax!,
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

    async createDaemon(): Promise<string> {
        const id = this.createUniqueId("daemon");
        const key = generateDaemonApiKey();
        const data: DaemonLocalDbFile = {
            id,
            apiKeyHash: key.hash,
            createdAt: Date.now(),
            setupComplete: false
        }
        this.writeJsonFile<DaemonLocalDbFile>("daemon", id, data);
        return key.apiKey;
    }

    async updateDaemon(daemonId: string, data: UpdateDaemonData) {
        // TODO validate data
        const raw = this.readJsonFile<DaemonLocalDbFile>("daemon", daemonId);
        this.writeJsonFile<DaemonLocalDbFile>("daemon", daemonId, {
            ...raw,
            cpuArch: data.cpuArch || raw.cpuArch,
            cpuName: data.cpuName || raw.cpuName,
            os: data.os || raw.os,
            segmentsMax: data.segmentsMax || raw.segmentsMax
        });
    }
    
    async setupDaemon(daemonId: string, data: SetupDaemonData) {
        // TODO validate data
        const raw = this.readJsonFile<DaemonLocalDbFile>("daemon", daemonId);
        this.writeJsonFile<DaemonLocalDbFile>("daemon", daemonId, {
            ...raw,
            regionId: data.regionId,
            segmentsMax: data.segmentsMax,
            portRangeStart: data.portRangeStart,
            portRangeEnd: data.portRangeEnd
        });
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