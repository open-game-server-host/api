import { getApp, getVariant, getVersion, OGSHError } from "@open-game-server-host/backend-lib";
import { Container, ContainerData, RawContainer } from "../../interfaces/container";
import { ContainerDb } from "../containerDb";
import { DATABASE } from "../db";
import { LocalDb } from "./localDb";

export class LocalContainerDb extends LocalDb implements ContainerDb {
    constructor() {
        super("localdb/containers");
    }

    async get(id: string): Promise<Container> {
        const raw = this.readJsonFile<RawContainer>(id);
        const app = await getApp(raw.app_id);
        if (!app) {
            throw new OGSHError("app/not-found", `container id '${id}' has an invalid app, id '${raw.app_id}'`);
        }
        const variant = await getVariant(raw.app_id, raw.variant_id);
        if (!variant) {
            throw new OGSHError("app/variant-not-found", `container id '${id}' has an invalid variant, app id '${raw.app_id}' variant id '${raw.variant_id}'`);
        }
        const version = await getVersion(raw.app_id, raw.variant_id, raw.version_id);
        if (!version) {
            throw new OGSHError("app/version-not-found", `container id '${id}' has an invalid version, app id '${raw.app_id}' variant id '${raw.variant_id}' version id '${raw.version_id}'`);
        }
        return {
            app,
            variant,
            version,
            contract_length_days: raw.contract_length_days,
            created_at: raw.created_at,
            daemon: await DATABASE.daemon.get(raw.daemon_id),
            free: raw.free,
            id: raw.id,
            locked: raw.locked,
            name: raw.name,
            terminate_at: raw.terminate_at,
            user_id: raw.user_id
        }
    }

    async create(data: ContainerData): Promise<Container> {
        const id = this.createUniqueId();
        this.writeJsonFile<RawContainer>(id, {
            id,
            ...data
        });
        return this.get(id);
    }

    async listByDaemon(daemonId: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<RawContainer>().filter(c => c.daemon_id === daemonId)) {
            containers.push(await this.get(raw.id));
        }
        return containers;
    }

    async listByUser(uid: string): Promise<Container[]> {
        const containers: Container[] = [];
        for (const raw of this.listJsonFiles<RawContainer>().filter(c => c.user_id === uid)) {
            containers.push(await this.get(raw.id));
        }
        return containers;
    }

    async delete(id: string): Promise<void> {
        this.deleteJsonFile(id);
    }
}