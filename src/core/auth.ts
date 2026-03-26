// middleware/auth.ts
import dotenv from "dotenv";
dotenv.config();

import { Context, Next } from "hono";
import jwt, { JwtPayload } from "jsonwebtoken";
import { db } from "../db/db.config";
import { userSessions } from "../db/schema";
import { and, eq, gt } from "drizzle-orm";

const SECRET = process.env.JWT_SECRET!;
interface MyJwtPayload {
  id: string;      // user UUID
  session: string; // refresh token
  iat?: number;
  exp?: number;
}
export const authMiddleware = async (c: Context, next: Next) => {
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google/login",
  ];

  const path = c.req.path;

  if (publicRoutes.includes(path)) return next();

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ status: false, message: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any; 
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as MyJwtPayload;
    // console.log("Decoded JWT:", decoded);

    const session = await db.query.userSessions.findFirst({
      where: and(
        eq(userSessions.userId, decoded.uuid),
        eq(userSessions.refreshToken, decoded.session),
        // gt(userSessions.expiresAt, new Date())
      ),
    });

    if (!session) {
      return c.json({
        status: false,
        message: "Session expired or logged in on another device",
      }, 401);
    }

    c.set("user", decoded);
    await next();
  } catch (err) {
    console.log("JWT verification failed:", err);
    return c.json({ status: false, message: "Unauthorized" }, 401);
  }
};