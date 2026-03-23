// utils/google.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env" }); //
import { OAuth2Client, TokenPayload } from "google-auth-library";

if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID not set in environment variables");
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    try {

        const ticket = await client.verifyIdToken({
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