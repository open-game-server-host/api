import { parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import { DbType } from "./db/db.js";
import { BrokerType } from "./ws/brokers/broker.js";

const dbKey = "OGSH_DB";
const brokerKey = "OGSH_BROKER";

const parsedVariables = parseEnvironmentVariables([
    {
        key: dbKey,
        defaultValue: "local"
    },
    {
        key: brokerKey,
        defaultValue: "local"
    }
]);

export function getDbType(): DbType {
    return parsedVariables.get(dbKey)! as DbType;
}

export function getBrokerType(): BrokerType {
    return parsedVariables.get(brokerKey)! as BrokerType;
}