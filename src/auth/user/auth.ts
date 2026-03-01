import { OGSHError } from "@open-game-server-host/backend-lib";
import { getAuthType } from "../../env.js";
import { FirebaseAuth } from "./firebaseAuth.js";

export type AuthType =
    | "none"
    | "firebase"
;

export type AuthUid = string;

export interface Auth {
    validateUser(token: string): Promise<AuthUid>;
}

export const AUTH = createAuth();

function createAuth(): Auth {
    switch (getAuthType()) {
        case "none": return createNoneAuth();
        case "firebase": return createFirebaseAuth();
        default: throw new OGSHError("general/unspecified", "no auth type defined");
    }
}

function createNoneAuth(): Auth {
    return {
        validateUser: async (token: string) => token // Use token as authUid
    }
}

function createFirebaseAuth(): Auth {
    const firebaseAuth = new FirebaseAuth();
    return {
        validateUser: firebaseAuth.validateUser.bind(firebaseAuth)
    }
}