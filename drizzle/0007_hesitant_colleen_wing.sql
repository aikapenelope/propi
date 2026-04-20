ALTER TABLE "contacts" ADD COLUMN "pref_property_type" "property_type";--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "pref_city" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "pref_budget_max" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "pref_operation" "operation";