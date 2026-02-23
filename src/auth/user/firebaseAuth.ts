import { OGSHError, parseEnvironmentVariables } from "@open-game-server-host/backend-lib";
import firebase from "firebase-admin";
import { Auth as FbAuth } from "firebase-admin/auth";
import { Auth, AuthUid } from "./auth.js";

export class FirebaseAuth implements Auth {
    private readonly auth: FbAuth;

    constructor() {
        parseEnvironmentVariables([
            {
                key: "GOOGLE_APPLICATION_CREDENTIALS" // This is full path to the service account json file
            }
        ]);
        this.auth = firebase.initializeApp().auth();
    }

    async validateUser(token: string): Promise<AuthUid> {
        const decodedToken = await this.auth.verifyIdToken(token).catch(error => {
            throw new OGSHError("auth/invalid", error);
        });
        return decodedToken.uid;
    }
}