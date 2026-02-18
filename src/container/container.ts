import { Container, getVersion, OGSHError } from "@open-game-server-host/backend-lib";
import { DATABASE } from "../db/db";

export async function createContainer(userId: string, regionId: string, appId: string, variantId: string, versionId: string, segments: number, name: string): Promise<Container> {
    const version = await getVersion(appId, variantId, versionId);
    if (!version) {
        throw new OGSHError("app/version-not-found", `failed to create container with app id '${appId}' variant id '${variantId}' version id '${version}'`);
    }

    const container = await DATABASE.container.create({
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

    // await sendInternalDaemonRequest(container.daemon, `/v1/internal/container/${container.id}`, {
    //     app_id: appId,
    //     variant_id: variantId,
    //     version_id: versionId,
    //     segments,
    //     runtime: container.runtime,
    //     ports: container.ports
    // });

    return container;
}