CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
ALTER TABLE "contents" ADD COLUMN "status" "content_status" DEFAULT 'draft' NOT NULL;