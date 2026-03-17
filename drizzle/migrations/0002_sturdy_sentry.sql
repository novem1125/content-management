ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_user_id_unique";--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "owner_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();