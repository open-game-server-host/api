import { Daemon, DaemonData, OGSHError, parseEnvironmentVariables, RawDaemon } from "@open-game-server-host/backend-lib";

export type SegmentReserveMethod = 
    | "fifo"
    | "balanced"
;

export const segmentReserveMethod = parseEnvironmentVariables([
    {
        key: "OGSH_SEGMENT_RESERVE_METHOD",
        defaultValue: "fifo"
    }
]).get("OGSH_SEGMENT_RESERVE_METHOD")! as SegmentReserveMethod;

export async function sendInternalDaemonRequest(host: Daemon | DaemonData | RawDaemon | string, path: string, body: any) {
    let url: string;
    if (typeof host === "string") {
        url = host;
    } else {
        url = host.url;
    }

    if (url.endsWith("/")) {
        url = url.substring(0, url.length - 1);
    }
    if (!path.startsWith("/")) {
        path = `/${path}`;
    }

    url = `${url}${path}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            authorization: `TODO`,
            "content-type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (response.status !== 200) {
        const body = await response.text();
        try {
            const json = JSON.parse(body);
            if (json.error) {
                throw new OGSHError(json.error.error, json.error.info);
            }
        } catch (error) {
        }
        throw new OGSHError("general/unspecified", `failed to send internal daemon request to '${url}', status: ${response.status}, status text: ${response.statusText}, body: ${body}`);
    }
}