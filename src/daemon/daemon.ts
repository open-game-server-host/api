import { Daemon, OGSHError, parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import crypto from "crypto";

export type SegmentReserveMethod = 
    | "fifo"
    | "balanced"
;

const parsedEnv = parseEnvironmentVariables([
    {
        key: "OGSH_SEGMENT_RESERVE_METHOD",
        defaultValue: "fifo"
    },
    {
        key: "OGSH_DAEMON_SIGNING_KEY",
        defaultValue: "USE A DIFFERENT KEY IN PRODUCTION"
    }
]);

export const segmentReserveMethod = parsedEnv.get("OGSH_SEGMENT_RESERVE_METHOD")! as SegmentReserveMethod
const daemonSigningKey = new TextEncoder().encode(parsedEnv.get("OGSH_DAEMON_SIGNING_KEY")!);

export async function sendInternalDaemonRequest(host: Daemon | string, path: string, body: any = {}) {
    let url: string;
    if (typeof host === "string") {
        url = host;
    } else {
        if (!host.url) {
            throw new OGSHError("general/unspecified", `tried to send request to daemon id '${host.id}' but setup is incomplete`);
        }
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

function generateRawApiKey(): string {
    return crypto.randomBytes(32).toString("hex");
}

function generateApiKeyHash(key: string): string {
    return crypto.createHmac("sha256", daemonSigningKey).update(key).digest("hex");
}

interface DaemonApikey {
    apiKey: string;
    hash: string;
}
export function generateDaemonApiKey(): DaemonApikey {
    const apiKey = generateRawApiKey();
    return {
        apiKey,
        hash: generateApiKeyHash(apiKey)
    }
}

export function isDaemonApiKeyValid(providedApiKey: string, storedHash: string): boolean {
    return generateApiKeyHash(providedApiKey) === storedHash;
}