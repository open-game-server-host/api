import { OGSHError, parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import { AuthType } from "./auth/user/auth.js";
import { DbType } from "./db/db.js";
import { BrokerType } from "./ws/brokers/broker.js";

const dbKey = "OGSH_DB";
const brokerKey = "OGSH_BROKER";
const authKey = "OGSH_AUTH";
const tlsCertPathKey = "OGSH_TLS_CERT";
const tlsKeyPathKey = "OGSH_TLS_KEY";
const portKey = "OGSH_PORT";

const parsedVariables = parseEnvironmentVariables([
    {
        key: dbKey,
        defaultValue: "local"
    },
    {
        key: brokerKey,
        defaultValue: "local"
    },
    {
        key: authKey,
        defaultValue: "none"
    },
    {
        key: tlsCertPathKey,
        defaultValue: "origin.crt"
    },
    {
        key: tlsKeyPathKey,
        defaultValue: "private.key"
    },
    {
        key: portKey,
        defaultValue: "443"
    }
]);

export function getDbType(): DbType {
    return parsedVariables.get(dbKey)! as DbType;
}

export function getBrokerType(): BrokerType {
    return parsedVariables.get(brokerKey)! as BrokerType;
}

export function getAuthType(): AuthType {
    return parsedVariables.get(authKey)! as AuthType;
}

export function getTlsCertPath(): string {
    return parsedVariables.get(tlsCertPathKey)!;
}

export function getTlsKeyPath(): string {
    return parsedVariables.get(tlsKeyPathKey)!;
}

export function getPort(): number {
    const port = +parsedVariables.get(portKey)!;
    if (!Number.isInteger(port)) {
        throw new OGSHError("general/unspecified", "port should be an integer");
    }
    return port;
}