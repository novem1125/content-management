import { db } from "../../../db/db.config";
import { followers, users } from "../../../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { IFollowerRepository } from "./followers.interface";
import { createFollower, createFollowerResponse } from "./types/follower";

export class followerReopsitory implements IFollowerRepository {
  async followUser(
    data: createFollower,
  ): Promise<createFollowerResponse | null> {
    const targetUserId = data.user_id || data.user_id;
    const followerId = data.follower_id || data.follower_id;

    if (!targetUserId || !followerId) {
      throw new Error("Both userId and followerId are required");
    }

    if (targetUserId === followerId) {
      throw new Error("You cannot follow yourself");
    }

    // Check if user to follow exists
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      throw new Error(`User with ID ${targetUserId} does not exist`);
    }

    // Check if follower user exists
    const [followerUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, followerId))
      .limit(1);

    if (!followerUser) {
      throw new Error(`Follower user with ID ${followerId} does not exist in database`);
    }

    try {
      const [follower] = await db
        .insert(followers)
        .values({
          id: crypto.randomUUID(),
          userId: targetUserId,
          followerId: followerId,
          status: data?.status ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing({ target: [followers.userId, followers.followerId] })
        .returning();

      if (!follower) {
        return null;
      }

      return {
        id: follower.id,
        userId: follower.userId,
        followerId: follower.followerId,
        status:follower.status,
        created_at: follower.createdAt ? follower.createdAt.toISOString() : new Date().toISOString(),
        updated_at: follower.updatedAt ? follower.updatedAt.toISOString() : new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("Follow User DB Error:", err);
      const detailMsg = err.cause?.detail || err.cause?.message || err.detail || err.message || "Failed to create follow relation";
      throw new Error(detailMsg);
    }
  }
}
