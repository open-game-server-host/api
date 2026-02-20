import { parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import { DbType } from "./db/db.js";

const dbKey = "OGSH_DB";

const parsedVariables = parseEnvironmentVariables([
    {
        key: dbKey,
        defaultValue: "local"
    }
]);

export function getDbType(): DbType {
    return parsedVariables.get(dbKey)! as DbType;
}