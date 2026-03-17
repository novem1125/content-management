CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"refresh_token" text NOT NULL,
	"user_agent" text NOT NULL,
	"ip_address" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "user_sessions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;