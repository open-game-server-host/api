import { Container } from "@open-game-server-host/backend-lib";
import { DATABASE } from "../db/db.js";
import { ContainerLocalDbFile } from "../db/local/localContainerDb.js";
import { BROKER } from "../ws/brokers/broker.js";

export async function createContainer(userId: string, regionId: string, appId: string, variantId: string, versionId: string, segments: number, name: string): Promise<Container> {
    console.log(2);
    const container = await DATABASE.createContainer({
        appId: appId,
        variantId: variantId,
        versionId: versionId,
        segments,
        free: false,
        name,
        regionId: regionId,
        userId: userId
    });
    console.log(3);

    await BROKER.registerContainer(container.daemon.id, container.id, {
        containerId: container.id,
        appId,
        variantId,
        versionId,
        segments,
        ports: container.ports
    });
    console.log(4);
    await BROKER.installContainer(container.daemon.id, container.id, {
        appId,
        variantId,
        versionId
    });
    console.log(5);

    return container;
}

export function isContainerTerminated(container: Container | ContainerLocalDbFile): boolean {
    return (container.terminateAt || Number.MAX_SAFE_INTEGER) <= Date.now();
}