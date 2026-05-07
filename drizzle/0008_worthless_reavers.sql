CREATE TYPE "public"."report_frequency" AS ENUM('weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."share_status" AS ENUM('pending', 'active', 'revoked');--> statement-breakpoint
CREATE TABLE "metric_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"broker_email" varchar(255) NOT NULL,
	"status" "share_status" DEFAULT 'active' NOT NULL,
	"permissions" jsonb DEFAULT '{"pipeline":true,"transactions":true,"activity":true,"contactsCount":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheduled_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"frequency" "report_frequency" DEFAULT 'monthly' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_sent_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "sold_price" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "commission_rate" numeric(5, 2) DEFAULT '5';--> statement-breakpoint
CREATE INDEX "metric_shares_agent_idx" ON "metric_shares" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "metric_shares_broker_email_idx" ON "metric_shares" USING btree ("broker_email");--> statement-breakpoint
CREATE INDEX "metric_shares_status_idx" ON "metric_shares" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduled_reports_user_idx" ON "scheduled_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_reports_next_run_idx" ON "scheduled_reports" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "scheduled_reports_active_idx" ON "scheduled_reports" USING btree ("active");--> statement-breakpoint
CREATE INDEX "properties_closed_at_idx" ON "properties" USING btree ("closed_at");