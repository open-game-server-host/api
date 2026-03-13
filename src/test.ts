import { getVariant } from "@open-game-server-host/backend-lib";

const appId = "minecraft_java_edition";
const variantId = "release";

(async () => {
    const variant = await getVariant(appId, variantId)!;
    let i = 0;
    while (true) {

        for (const [versionId, version] of Object.entries(variant!.versions).reverse()) {
            const response = await fetch(`https://api.opengameserverhost.com/v1/container`, {
                method: "POST",
                headers: {
                    authorization: "bearer user1",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    appId,
                    variantId,
                    versionId,
                    segments: version.minimumSegments,
                    name: `Test ${++i}`,
                    regionId: "1"
                })
            });
            const text = await response.text();
            if (response.status !== 200) {
                console.log(`[ERROR] status: ${response.status}, status text: ${response.statusText}, body: ${text}`);
                return;
            }
            console.log(`[${JSON.parse(text).data.id}] Created ${appId} / ${variantId} / ${versionId}`);
            // if (i >= 1) {
                // return;
            // }
        }
    }
})();