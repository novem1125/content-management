ALTER TABLE "contents" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "status" SET DEFAULT 'friends'::text;--> statement-breakpoint
DROP TYPE "public"."content_status";--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('only_me', 'public', 'all', 'friends');--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "status" SET DEFAULT 'friends'::"public"."content_status";--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "status" SET DATA TYPE "public"."content_status" USING "status"::"public"."content_status";