import { db } from "../../../db/db.config";
import { roles, users, userSessions } from "../../../db/schema";
import { userRegister, userResponse } from "./types/user.type";
import { IAuthRepository } from "./auth.interface";
import { sql, eq } from "drizzle-orm";

export interface SessionType {
    id: string;           // required UUID
    refreshToken: string;
    userAgent: string;
    userId?: string | null; // optional
    ipAddress?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    expiresAt?: Date | null;
}
export class AuthRepository implements IAuthRepository {
    async userRegister(userData: userRegister): Promise<userResponse> {
        const result = await db
            .insert(users)
            .values(userData)
            .returning({
                id: users.id,
                username: users.username,
                email: userData.emailOrPhone ?? (null as any),
                phone_no: userData.emailOrPhone ?? (null as any),
                role_id: users.role_id,
                createdAt: users.createdAt,
            });

        return result[0];
    }
    async findByEmailOrPhone(value: string): Promise<any> {
        const result = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                phone_no: users.phone_no,
                password: users.password,
                role_id: users.role_id,
                is_active: users.is_active,
                role: {
                    id: roles.id,
                    name: roles.name,
                },
            })
            .from(users)
            .leftJoin(roles, sql`${users.role_id} = ${roles.id}`)
            .where(sql`${users.email} = ${value} OR ${users.phone_no} = ${value}`)
            .limit(1);

        return result[0] || null;
    }
    async createSession(
        sessionToken: string,
        userId: string, // UUID
        userAgent?: string,
        userIp?: string
    ): Promise<SessionType> {
        const result = await db.insert(userSessions).values({
            userId: userId,                    // matches table
            refreshToken: sessionToken,        // matches table
            userAgent: userAgent ?? '',        // not undefined
            ipAddress: userIp ?? null,         // optional
            createdAt: new Date(),             // optional
        }).returning()

        return result[0];
    }

    // Get the latest session for a user
    async getSession(userId: string): Promise<SessionType | null> {
        const userSession = await db
            .select()
            .from(userSessions)
            .where(sql`${userSessions.userId} = ${userId}`)
            .orderBy(sql`${userSessions.createdAt} DESC`)
            .limit(1);

        return userSession[0] || null;
    }

    // Update session for a user
    async updateSession(
        sessionToken: string,
        userId: string,
        userAgent?: string,
        userIp?: string
    ): Promise<SessionType | null> {
        const updated = await db
            .update(userSessions)
            .set({
                refreshToken: sessionToken,
                userAgent: userAgent,
                ipAddress: userIp,
            })
            .where(sql`${userSessions.userId} = ${userId}`)
            .returning();

        return updated[0] || null;
    }
    async updateFirebaseKey(userId: string, firebaseKey: string): Promise<any> {
        const [updated] = await db
            .update(users)
            .set({ firebase_key: firebaseKey })
            .where(eq(users.id, userId))
            .returning()

        return updated
    }
}

