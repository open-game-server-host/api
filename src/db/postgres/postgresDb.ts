import { Pool } from "pg";

const pool = new Pool({
    // TODO
});

pool.on("connect", client => {
    // TODO
});

pool.on("error", (error, client) => {
    // TODO
});