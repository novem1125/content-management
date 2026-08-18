// utils/google.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { OAuth2Client, TokenPayload } from "google-auth-library";

let client: OAuth2Client | null = null;

function getGoogleClient(): OAuth2Client {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        throw new Error("GOOGLE_CLIENT_ID not set in environment variables");
    }
    if (!client) {
        client = new OAuth2Client(clientId);
    }
    return client;
}

export async function verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    try {
        const googleClient = getGoogleClient();
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, // must match token's aud
        });

        const payload = ticket.getPayload();

        if (!payload) throw new Error("Invalid Google token payload");
        return payload;
    } catch (err: any) {
        console.error("Google token verification failed:", err.message || err);
        throw new Error("Invalid Google token");
    }
}