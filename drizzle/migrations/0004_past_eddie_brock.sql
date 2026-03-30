ALTER TABLE "user_sessions" ADD COLUMN "otp_code" varchar(10);--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "otp_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "is_otp_verified" boolean DEFAULT false;