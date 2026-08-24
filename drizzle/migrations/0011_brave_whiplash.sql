CREATE TABLE "followers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"follower_id" uuid NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "followers_user_id_follower_id_unique" UNIQUE("user_id","follower_id")
);
--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "status" SET DEFAULT 'friends'::text;--> statement-breakpoint
DROP TYPE "public"."content_status";--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('only_me', 'all', 'friends');--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "status" SET DEFAULT 'friends'::"public"."content_status";--> statement-breakpoint
ALTER TABLE "contents" ALTER COLUMN "status" SET DATA TYPE "public"."content_status" USING "status"::"public"."content_status";--> statement-breakpoint
ALTER TABLE "followers" ADD CONSTRAINT "followers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followers" ADD CONSTRAINT "followers_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "followers_user_id_idx" ON "followers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "followers_follower_id_idx" ON "followers" USING btree ("follower_id");