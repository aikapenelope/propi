CREATE TABLE "agent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"bio" text,
	"phone" varchar(50),
	"email" varchar(255),
	"photo_url" text,
	"agency" varchar(255),
	"city" varchar(255),
	"whatsapp" varchar(50),
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "agent_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "agent_profiles_slug_idx" ON "agent_profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_profiles_user_idx" ON "agent_profiles" USING btree ("user_id");