import { OGSHError } from "@open-game-server-host/backend-lib";
import { getAuthType } from "../../env.js";
import { FirebaseAuth } from "./firebaseAuth.js";

export type AuthType =
    | "none"
    | "firebase"
;


export interface UserAuth {
    authUid: string;
    email: string;
}

export interface Auth {
    validateUser(token: string): Promise<UserAuth>;
}

export const AUTH = createAuth();

function createAuth(): Auth {
    switch (getAuthType()) {
        case "none": return createNoneAuth();
        case "firebase": return createFirebaseAuth();
        default: throw new OGSHError("env/invalid-value", "no auth type defined");
    }
}

function createNoneAuth(): Auth {
    return {
        // Use token as authUid
        validateUser: async (token: string) => {
            return {
                authUid: token,
                email: `${token}@example.com`
            }
        }
    }
}

function createFirebaseAuth(): Auth {
    const firebaseAuth = new FirebaseAuth();
    return {
        validateUser: firebaseAuth.validateUser.bind(firebaseAuth)
    }
}