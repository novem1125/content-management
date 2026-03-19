ALTER TABLE "roles" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_id" SET DATA TYPE integer;