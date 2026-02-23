import { parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import { AuthType } from "./auth/user/auth.js";
import { DbType } from "./db/db.js";
import { BrokerType } from "./ws/brokers/broker.js";

const dbKey = "OGSH_DB";
const brokerKey = "OGSH_BROKER";
const authKey = "OGSH_AUTH";
const tlsCertPathKey = "OGSH_TLS_CERT";
const tlsKeyPathKey = "OGSH_TLS_KEY";

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