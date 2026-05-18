CREATE TYPE "public"."activity_type" AS ENUM('email_sent', 'appointment_created', 'appointment_completed', 'pipeline_moved', 'property_shared', 'note_added', 'contact_created', 'task_created', 'document_uploaded');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"contact_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"title" varchar(500) NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_contact_idx" ON "activity_log" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "activity_log_user_idx" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_log_created_idx" ON "activity_log" USING btree ("created_at");