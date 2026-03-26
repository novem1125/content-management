import { pgTable, serial, varchar, timestamp, integer, text, uuid } from 'drizzle-orm/pg-core'
import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { boolean } from 'drizzle-orm/pg-core'

// ------------------
// Role table
// ------------------
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull().unique(),
})

// ------------------
// User table (UUID)
// ------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull(),
  email: text('email'),
  phone_no: text('phone_no'), // ✅ nullable
  password: text('password').notNull(),
  role_id: integer('role_id').references(() => roles.id),
  is_active: boolean('is_active').default(false),
  is_verified: boolean('is_verified').default(false),
  firebase_key: text('firebase_key'), // optional too
  googleId: text("google_id"),
  avatar: text("avatar"),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

// ------------------
// UserSession table
// ------------------
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  refreshToken: text('refresh_token').notNull(),
  userAgent: text('user_agent').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
})

// ------------------
// Content table
// ------------------
export const contents = pgTable('contents', {
  id: serial('id').primaryKey(),
  title: varchar('title').notNull(),
  photoUrl: varchar('photo_url').notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ------------------
// Types
// ------------------
export type RoleSelect = InferSelectModel<typeof roles>
export type RoleInsert = InferInsertModel<typeof roles>

export type UserSelect = InferSelectModel<typeof users>
export type UserInsert = InferInsertModel<typeof users>

export type UserSessionSelect = InferSelectModel<typeof userSessions>
export type UserSessionInsert = InferInsertModel<typeof userSessions>

export type ContentSelect = InferSelectModel<typeof contents>
export type ContentInsert = InferInsertModel<typeof contents>