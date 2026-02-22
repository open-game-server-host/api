import { Container, getVersion, OGSHError } from "@open-game-server-host/backend-lib";
import { DATABASE } from "../db/db.js";
import { ContainerLocalDbFile } from "../db/local/localContainerDb.js";
import { registerContainer } from "../ws/actions/containerWsActions.js";

export async function createContainer(userId: string, regionId: string, appId: string, variantId: string, versionId: string, segments: number, name: string): Promise<Container> {
    const version = await getVersion(appId, variantId, versionId);
    if (!version) {
        throw new OGSHError("app/version-not-found", `failed to create container with app id '${appId}' variant id '${variantId}' version id '${version}'`);
    }

    const container = await DATABASE.createContainer({
        app_id: appId,
        variant_id: variantId,
        version_id: versionId,
        segments,
        free: false,
        name,
        region_id: regionId,
        runtime: version.default_runtime,
        user_id: userId
    });

    registerContainer(container.daemon.id, {
        containerId: container.id,
        appId,
        variantId,
        versionId,
        segments,
        ipv4Ports: container.ipv4_ports,
        ipv6Ports: container.ipv6_ports
    });

    return container;
}

export function isContainerTerminated(container: Container | ContainerLocalDbFile): boolean {
    return (container.terminate_at || Number.MAX_SAFE_INTEGER) <= Date.now();
}