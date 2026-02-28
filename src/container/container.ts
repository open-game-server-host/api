import { Container, getVersion, OGSHError } from "@open-game-server-host/backend-lib";
import { DATABASE } from "../db/db.js";
import { ContainerLocalDbFile } from "../db/local/localContainerDb.js";
import { BROKER } from "../ws/brokers/broker.js";

export async function createContainer(userId: string, regionId: string, appId: string, variantId: string, versionId: string, segments: number, name: string): Promise<Container> {
    const version = await getVersion(appId, variantId, versionId);
    if (!version) {
        throw new OGSHError("app/version-not-found", `failed to create container with app id '${appId}' variant id '${variantId}' version id '${version}'`);
    }

    const container = await DATABASE.createContainer({
        appId: appId,
        variantId: variantId,
        versionId: versionId,
        segments,
        free: false,
        name,
        regionId: regionId,
        runtime: version.defaultRuntime,
        userId: userId
    });

    await BROKER.registerContainer(container.daemon.id, container.id, {
        containerId: container.id,
        appId,
        variantId,
        versionId,
        segments,
        ports: container.ports
    });

    return container;
}

export function isContainerTerminated(container: Container | ContainerLocalDbFile): boolean {
    return (container.terminateAt || Number.MAX_SAFE_INTEGER) <= Date.now();
}