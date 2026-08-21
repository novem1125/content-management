import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { userSessions, users, roles } from "../db/schema";
import { eq, and, gte, isNull, or } from "drizzle-orm";
import { db } from "../db/db.config";

// Define typed variables for Hono context
export type AuthUser = {
  id: string;
  role: string;
  username:string;
  email: string | null;
};

type Env = {
  Variables: {
    user: AuthUser;
  };
};

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "contentusersecret";

export async function authMiddleware(c: Context<Env>, next: Next) {
  try {
    // 1. Extract Bearer token from headers
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, message: "Unauthorized: Missing token" }, 401);
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify JWT signature & expiration
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      console.error("JWT Verification Error:", err.message);
      return c.json({ success: false, message: "Unauthorized: Invalid or expired token" }, 401);
    }

    const targetUserId = payload.sub || payload.uuid || payload.id;
    if (!targetUserId) {
      return c.json({ success: false, message: "Unauthorized: Invalid token payload" }, 401);
    }

    const whereConditions = [
      eq(userSessions.userId, targetUserId),
      or(
        isNull(userSessions.expiresAt),
        gte(userSessions.expiresAt, new Date())
      )
    ];

    if (payload.session_token) {
      whereConditions.push(eq(userSessions.refreshToken, payload.session_token));
    }

    const [session] = await db
      .select({
        userId: users.id,
        email: users.email,
        username: users.username,
        isActive: users.is_active,
        roleName: roles.name,
      })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(and(...whereConditions))
      .limit(1);

    if (!session || !session.isActive) {
      return c.json({ success: false, message: "Unauthorized: Invalid session or deactivated user" }, 401);
    }

    // 4. Attach user data to Hono context
    c.set("user", {
      id: session.userId,
      email: session.email,
      username:session.username,
      role: session.roleName || "User", // Default fallback if no role assigned
    });

    // 5. Proceed to next handler/controller
    await next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return c.json({ success: false, message: "Internal server error during auth" }, 500);
  }
}