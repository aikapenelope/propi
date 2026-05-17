ALTER TABLE "messages" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING metadata::jsonb;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_platform_user_uniq" UNIQUE("platform","user_id");
