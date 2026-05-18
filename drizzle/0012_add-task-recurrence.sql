DROP TABLE "campaign_recipients" CASCADE;--> statement-breakpoint
DROP TABLE "drip_enrollments" CASCADE;--> statement-breakpoint
DROP TABLE "drip_sequences" CASCADE;--> statement-breakpoint
DROP TABLE "email_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "scheduled_reports" CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "recurrence" varchar(20);--> statement-breakpoint
DROP TYPE "public"."campaign_status";--> statement-breakpoint
DROP TYPE "public"."report_frequency";