import { Container, getGlobalConfig, OGSHError } from "@open-game-server-host/backend-lib";
import { DATABASE } from "../db/db.js";
import { ContainerLocalDbFile } from "../db/local/localContainerDb.js";
import { BROKER } from "../ws/brokers/broker.js";

export async function createContainer(userId: string, regionId: string, appId: string, variantId: string, versionId: string, segments: number, name: string): Promise<Container> {
    const globalConfig = await getGlobalConfig();
    if (segments > globalConfig.maxSegments) {
        throw new OGSHError("container/segment-limit", `create container segments '${segments}' is above max segments '${globalConfig.maxSegments}'`);
    }

    const container = await DATABASE.createContainer({
        appId: appId,
        variantId: variantId,
        versionId: versionId,
        segments,
        name,
        regionId: regionId,
        userId: userId
    });

    await BROKER.registerContainer(container.daemon.id, {
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