import { HTTPStatus, OGSHError, respond } from "@open-game-server-host/backend-lib";
import { Router } from "express";
import { getDaemonApiKeyFromRequest } from "../../auth/daemonAuth.js";
import { hashDaemonApiKey } from "../../daemon/daemon.js";
import { DATABASE } from "../../db/db.js";

export const registryHttpRouter = Router();

type RegistryAuthType =
    | "daemon"
    | "uploader"
;

// Used for validating docker registry daemon api keys
registryHttpRouter.get("/auth/:type", async (req, res) => {
    const type = req.params.type as RegistryAuthType;
    switch (type) {
        case "daemon":
            const apiKey = getDaemonApiKeyFromRequest(req);
            const hash = hashDaemonApiKey(apiKey);
            if (await DATABASE.validateDaemonByApiKeyHash(hash)) {
                respond(res);
            } else {
                res.status(HTTPStatus.UNAUTHORIZED);
                res.send();
            }
            break;
        case "uploader":
            // TODO
            res.status(HTTPStatus.UNAUTHORIZED);
            res.send();
            break;
        default:
            throw new OGSHError("auth/invalid", `invalid auth type '${type}'`);
    }
});