import dotenv from "dotenv";
dotenv.config();

import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { db } from "../db/db.config";
import { userSessions } from "../db/schema";
import { and, eq, gt } from "drizzle-orm";

const SECRET = process.env.JWT_SECRET!;

export const authMiddleware = async (c: Context, next: Next) => {
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google/login",
  ];

  if (publicRoutes.includes(c.req.path)) return next();

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ status: false, message: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ decode JWT
    const decoded: any = jwt.verify(token, SECRET);
    // ✅ find session in DB
    const session = await db.query.userSessions.findFirst({
      where: and(
        eq(userSessions.userId, decoded.uuid),           // decoded user UUID
        eq(userSessions.refreshToken, decoded.session_token), // refresh token
        // gt(userSessions.expiresAt, new Date())          // not expired
      ),
    });
    if (!session) {
      return c.json({
        status: false,
        message: "Session expired or logged in on another device",
      }, 401);
    }

    // ✅ set both user info and session_id in context
    c.set("user", decoded);                // e.g. { id: 'uuid', email: '...' }
    c.set("session_id", session.id);       // ✅ this fixes your OTP issue

    await next();
  } catch (err) {
    console.log("JWT verification failed:", err);
    return c.json({ status: false, message: "Unauthorized" }, 401);
  }
};