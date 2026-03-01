import { Logger, OGSHError, parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import { Pool, QueryResult } from "pg";

const hostKey = "OGSH_POSTGRES_HOST";
const portKey = "OGSH_POSTGRES_PORT";
const userKey = "OGSH_POSTGRES_USER";
const passwordKey = "OGSH_POSTGRES_PASSWORD";
const caPathKey = "OGSH_POSTGRES_CA_PATH";
const certPathKey = "OGSH_POSTGRES_CERT_PATH";

async function createPool(logger: Logger): Promise<Pool> {
    const parsed = parseEnvironmentVariables([
        {
            key: hostKey
        },
        {
            key: portKey
        },
        {
            key: userKey
        },
        {
            key: passwordKey
        },
        {
            key: caPathKey,
            defaultValue: "ca.crt"
        },
        {
            key: certPathKey,
            defaultValue: "cert.crt"
        }
    ]);

    const host = parsed.get(hostKey)!;
    const port = +parsed.get(portKey)!;
    if (!Number.isInteger(port)) {
        throw new OGSHError("general/unspecified", `postgres port must be an integer`);
    }
    const user = parsed.get(userKey)!;
    const password = parsed.get(passwordKey)!;

    logger.info("Connecting to Postgres", {
        host,
        port,
        user
    });
    const pool = new Pool({
        host,
        port,
        user,
        password,
        // TODO enable ssl after testing
        // ssl: {
            // ca: readFileSync(parsed.get(caPathKey)!).toString(),
            // cert: readFileSync(parsed.get(certPathKey)!).toString()
        // }
    });
    pool.connect().catch(error => {
        throw new OGSHError("general/unspecified", error);
    });

    return pool;
}

export abstract class PostgresDb {
    private static logger = new Logger();
    private static pool: Promise<Pool> = createPool(PostgresDb.logger);

    static {
        PostgresDb.pool.catch(error => {
            // TODO proper error handling
            console.error(error);
        });
    }

    protected async query(statement: string, ...args: any[]): Promise<QueryResult> {
        const client = await (await PostgresDb.pool).connect();
        return client.query(statement, args).then(result => {
            client.release();
            return result;
        }).catch(error => {
            client.release();
            throw new OGSHError("general/unspecified", error);
        });
    }

    protected async countQuery(statement: string, ...args: any[]): Promise<number> {
        const result = await this.query(statement, ...args);
        if (result.rowCount === 0 || !result.rows[0].count) {
            throw new OGSHError("general/unspecified", `countQuery function did not produce a "count" row, statement: '${statement}'`);
        }
        const count = +result.rows[0].count;
        if (!Number.isInteger(count)) {
            throw new OGSHError("general/unspecified", `"count" was not an integer, statement: '${statement}'`);
        }
        return count;
    }
}