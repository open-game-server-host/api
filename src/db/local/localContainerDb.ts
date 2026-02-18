import { Container, CreateContainerData, getVariant, getVersion, OGSHError, RawContainer } from "@open-game-server-host/backend-lib";
import { segmentReserveMethod } from "../../daemon/daemon";
import { ContainerDb } from "../containerDb";
import { DATABASE } from "../db";
import { LocalDb } from "./localDb";

export class LocalContainerDb extends LocalDb implements ContainerDb {
    constructor() {
        super("containers");
    }

    async get(id: string): Promise<Container> {
        const raw = this.readJsonFile<RawContainer>(id);
        const ports = await DATABASE.container_port.listByContainer(id);
        return {
            app_id: raw.app_id,
            variant_id: raw.variant_id,
            version_id: raw.version_id,
            contract_length_days: raw.contract_length_days,
            created_at: raw.created_at,
            daemon: await DATABASE.daemon.get(raw.daemon_id),
            free: raw.free,
            id: raw.id,
            locked: raw.locked,
            name: raw.name,
            ports: ports.ports,
            runtime: raw.runtime,
            segments: raw.segments,
            terminate_at: raw.terminate_at,
            user_id: raw.user_id,
        }
    }

    async create(data: CreateContainerData): Promise<Container> {
        // TODO validate container data

        const id = this.createUniqueId();
        this.writeJsonFile<RawContainer>(id, {
            id,
            ...data,
            contract_length_days: 30, // TODO this should be defined by the plan the user selects at checkout
            created_at: Date.now(),
            daemon_id: await DATABASE.daemon.reserveSegments(data.region_id, segmentReserveMethod, data.segments),
            locked: false
        });
        const variant = await getVariant(data.app_id, data.variant_id);
        const ports: number[] = [];
        Object.keys(variant?.ports || {}).forEach(port => ports.push(+port));
        await DATABASE.container_port.assign(id, ports);
        return this.get(id);
    }

    async listByDaemon(daemonId: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<RawContainer>().filter(c => c.data.daemon_id === daemonId)) {
            containers.push(await this.get(raw.id));
        }
        return containers;
    }

    async listByUser(uid: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<RawContainer>().filter(c => c.data.user_id === uid)) {
            containers.push(await this.get(raw.id));
        }
        return containers;
    }

    async delete(id: string): Promise<void> {
        this.deleteJsonFile(id);
    }
}