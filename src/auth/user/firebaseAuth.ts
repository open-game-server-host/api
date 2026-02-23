import { OGSHError } from "@open-game-server-host/backend-lib";
import firebase, { AppOptions } from "firebase-admin";
import { Auth as FbAuth } from "firebase-admin/auth";
import { Auth, AuthUid } from "./auth.js";

export class FirebaseAuth implements Auth {
    private readonly auth: FbAuth;

    constructor() {
        // TODO get options from env
        const options: AppOptions = {

        }
        this.auth = firebase.initializeApp(options).auth();
    }

    async validateUser(token: string): Promise<AuthUid> {
        const decodedToken = await this.auth.verifyIdToken(token).catch(error => {
            throw new OGSHError("auth/invalid", error);
        });
        return decodedToken.uid;
    }
}