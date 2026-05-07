ALTER TABLE "properties" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "sold_price" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "commission_rate" numeric(5, 2) DEFAULT '5';--> statement-breakpoint
CREATE INDEX "properties_closed_at_idx" ON "properties" USING btree ("closed_at");