import { Container, ContainerData, getVersion, OGSHError, RawContainer } from "@open-game-server-host/backend-lib";
import { sendInternalDaemonRequest } from "../daemon/daemon";
import { DATABASE } from "../db/db";

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
        runtime: version.default_docker_image,
        user_id: userId
    });

    await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}`, {
        app_id: appId,
        variant_id: variantId,
        version_id: versionId,
        segments,
        runtime: container.runtime,
        ports: container.ports
    });

    return container;
}

export function isContainerTerminated(container: Container | RawContainer | ContainerData): boolean {
    return (container.terminate_at || Number.MAX_SAFE_INTEGER) <= Date.now();
}