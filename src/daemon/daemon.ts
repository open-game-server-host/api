import { Daemon, parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
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

export function isDaemonApiKeyValid(providedApiKey: string, storedHash: Daemon | string): boolean {
    let hash: string;
    if (typeof storedHash === "string") {
        hash = storedHash;
    } else {
        hash = storedHash.api_key_hash;
    }
    return generateApiKeyHash(providedApiKey) === hash;
}