import { Logger, OGSHError, parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import { Pool, QueryResult, QueryResultRow } from "pg";

const hostKey = "OGSH_POSTGRES_HOST";
const portKey = "OGSH_POSTGRES_PORT";
const userKey = "OGSH_POSTGRES_USER";
const passwordKey = "OGSH_POSTGRES_PASSWORD";
const caPathKey = "OGSH_POSTGRES_CA_PATH";
const certPathKey = "OGSH_POSTGRES_CERT_PATH";

async function createPool(): Promise<Pool> {
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

    const port = +parsed.get(portKey)!;
    if (!Number.isInteger(port)) {
        throw new OGSHError("general/unspecified", `postgres port must be an integer`);
    }

    const pool = new Pool({
        host: parsed.get(hostKey)!,
        port,
        user: parsed.get(portKey)!,
        password: parsed.get(passwordKey)!,
        // TODO enable ssl after testing
        // ssl: {
            // ca: readFileSync(parsed.get(caPathKey)!).toString(),
            // cert: readFileSync(parsed.get(certPathKey)!).toString()
        // }
    });
    pool.connect();

    return pool;
}

export abstract class PostgresDb {
    private static logger = new Logger("POSTGRES DB");
    private static pool: Promise<Pool> = createPool();

    static {
        (async () => {
            const pool = await this.pool;

            pool.on("error", (error, client) => {
                this.logger.error(error);
            });
        })();
    }

    protected async query<R extends QueryResultRow = any>(statement: string, ...args: string[]): Promise<QueryResult<R>> {
        const client = await (await PostgresDb.pool).connect();
        return client.query(statement, args).then(result => {
            client.release();
            return result;
        }).catch(error => {
            client.release();
            throw new OGSHError("general/unspecified", error);
        });
    }
}