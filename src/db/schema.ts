import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  uuid,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { boolean } from "drizzle-orm/pg-core";

// ------------------
// Role table
// ------------------
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
});

// ------------------
// User table (UUID)
// ------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  email: text("email"),
  phone_no: text("phone_no"), // ✅ nullable
  password: text("password").notNull(),
  role_id: integer("role_id").references(() => roles.id),
  is_active: boolean("is_active").default(false),
  is_verified: boolean("is_verified").default(false),
  firebase_key: text("firebase_key"), // optional too
  googleId: text("google_id"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ------------------
// UserSession table
// ------------------
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id").references(() => users.id),

  refreshToken: text("refresh_token").notNull(),

  userAgent: text("user_agent").notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),

  // 🔐 OTP fields
  otpCode: varchar("otp_code", { length: 10 }), // store OTP (e.g. 6 digits)
  otpExpiry: timestamp("otp_expiry"), // expiration time
  isOtpVerified: boolean("is_otp_verified").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const followers = pgTable(
  "followers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // The user being followed
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    // The user who follows
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id),

    status: boolean("status").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),

    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userFollowerUnique: unique().on(table.userId, table.followerId),

    userIdIdx: index("followers_user_id_idx").on(table.userId),

    followerIdIdx: index("followers_follower_id_idx").on(table.followerId),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  followers: many(followers, {
    relationName: "userFollowers",
  }),

  following: many(followers, {
    relationName: "userFollowing",
  }),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  user: one(users, {
    fields: [followers.userId],
    references: [users.id],
    relationName: "userFollowers",
  }),

  follower: one(users, {
    fields: [followers.followerId],
    references: [users.id],
    relationName: "userFollowing",
  }),
}));
// ------------------
// Content table
// ------------------
export const contentStatusEnum = pgEnum("content_status", [
  "only_me",
  "all",
  "friends",
]);

export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  photo: text("photo").array(),
  video: text("video").array(),
  ownerId: uuid("owner_id").references(() => users.id),
  status: contentStatusEnum("status").default("friends").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ------------------
// Types
// ------------------
export type RoleSelect = InferSelectModel<typeof roles>;
export type RoleInsert = InferInsertModel<typeof roles>;

export type UserSelect = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

export type UserSessionSelect = InferSelectModel<typeof userSessions>;
export type UserSessionInsert = InferInsertModel<typeof userSessions>;

export type ContentSelect = InferSelectModel<typeof contents>;
export type ContentInsert = InferInsertModel<typeof contents>;
