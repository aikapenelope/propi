CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."contact_source" AS ENUM('website', 'referral', 'instagram', 'facebook', 'whatsapp', 'portal', 'walk_in', 'phone', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('contract', 'id_copy', 'deed', 'appraisal', 'floor_plan', 'invoice', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'showing', 'offer', 'closed', 'lost');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."operation" AS ENUM('sale', 'rent', 'sale_rent');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('draft', 'active', 'reserved', 'sold', 'rented', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'house', 'land', 'commercial', 'office', 'warehouse', 'other');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('instagram', 'facebook', 'whatsapp', 'mercadolibre', 'wasi');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"location" text,
	"contact_id" uuid,
	"property_id" uuid,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contact_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_tags" (
	"contact_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "contact_tags_contact_id_tag_id_pk" PRIMARY KEY("contact_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"notes" text,
	"source" "contact_source" DEFAULT 'other',
	"lead_status" "lead_status" DEFAULT 'new' NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "social_platform" NOT NULL,
	"external_id" varchar(500),
	"contact_id" uuid,
	"participant_name" varchar(255),
	"participant_external_id" varchar(255),
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_inbound_at" timestamp with time zone,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(500) NOT NULL,
	"type" "document_type" DEFAULT 'other',
	"key" text NOT NULL,
	"filename" varchar(500),
	"size_bytes" integer,
	"mime_type" varchar(255),
	"contact_id" uuid,
	"property_id" uuid,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drip_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drip_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" varchar(500) NOT NULL,
	"html_body" text NOT NULL,
	"tag_id" uuid,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"sent_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"params" jsonb NOT NULL,
	"kpis" jsonb,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_results" integer,
	"dedup_results" integer,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"source" text DEFAULT 'mercadolibre' NOT NULL,
	"site_id" text DEFAULT 'MLV' NOT NULL,
	"title" text,
	"price" numeric,
	"currency" text,
	"area_m2" numeric,
	"bedrooms" integer,
	"bathrooms" integer,
	"parking" integer,
	"property_type" text,
	"operation" text,
	"city" text,
	"state" text,
	"neighborhood" text,
	"latitude" numeric,
	"longitude" numeric,
	"condition" text,
	"permalink" text,
	"thumbnail" text,
	"seller_nickname" text,
	"published_at" timestamp,
	"last_seen_at" timestamp DEFAULT now(),
	"attributes" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "market_listings_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" "message_direction" NOT NULL,
	"body" text,
	"external_id" varchar(500),
	"status" "message_status" DEFAULT 'pending' NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" "property_type" DEFAULT 'apartment' NOT NULL,
	"operation" "operation" DEFAULT 'sale' NOT NULL,
	"status" "property_status" DEFAULT 'draft' NOT NULL,
	"price" numeric(14, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"area" numeric(10, 2),
	"bedrooms" integer,
	"bathrooms" integer,
	"parking_spaces" integer,
	"address" text,
	"city" varchar(255),
	"state" varchar(255),
	"zip_code" varchar(20),
	"country" varchar(100) DEFAULT 'VE',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"external_ids" jsonb,
	"external_links" jsonb,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"key" text NOT NULL,
	"filename" varchar(500),
	"sort_order" integer DEFAULT 0,
	"is_cover" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_tags" (
	"property_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "property_tags_property_id_tag_id_pk" PRIMARY KEY("property_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "social_platform" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"platform_account_id" varchar(255) NOT NULL,
	"account_name" varchar(255),
	"token_expires_at" timestamp with time zone,
	"metadata" jsonb,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#6366f1',
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"contact_id" uuid,
	"property_id" uuid,
	"due_at" timestamp with time zone,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drip_enrollments" ADD CONSTRAINT "drip_enrollments_sequence_id_drip_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."drip_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drip_enrollments" ADD CONSTRAINT "drip_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tags" ADD CONSTRAINT "property_tags_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tags" ADD CONSTRAINT "property_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_starts_at_idx" ON "appointments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "appointments_contact_idx" ON "appointments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "appointments_property_idx" ON "appointments" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "appointments_user_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_recipients_campaign_idx" ON "campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_recipients_contact_idx" ON "campaign_recipients" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contact_notes_contact_idx" ON "contact_notes" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contact_notes_user_idx" ON "contact_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contact_notes_created_idx" ON "contact_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_tags_contact_idx" ON "contact_tags" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contact_tags_tag_idx" ON "contact_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "contacts_name_idx" ON "contacts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contacts_user_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contacts_lead_status_idx" ON "contacts" USING btree ("lead_status");--> statement-breakpoint
CREATE INDEX "conversations_platform_idx" ON "conversations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "conversations_contact_idx" ON "conversations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "conversations_external_idx" ON "conversations" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "conversations_last_msg_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "conversations_user_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_contact_idx" ON "documents" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "documents_property_idx" ON "documents" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "documents_user_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "drip_enrollments_sequence_idx" ON "drip_enrollments" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "drip_enrollments_contact_idx" ON "drip_enrollments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "drip_enrollments_next_run_idx" ON "drip_enrollments" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "drip_enrollments_user_idx" ON "drip_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "drip_sequences_user_idx" ON "drip_sequences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaigns_user_idx" ON "email_campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magic_searches_user_idx" ON "magic_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magic_searches_created_idx" ON "magic_searches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "market_listings_external_idx" ON "market_listings" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "market_listings_type_op_idx" ON "market_listings" USING btree ("property_type","operation");--> statement-breakpoint
CREATE INDEX "market_listings_city_hood_idx" ON "market_listings" USING btree ("city","neighborhood");--> statement-breakpoint
CREATE INDEX "market_listings_published_idx" ON "market_listings" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "market_listings_price_idx" ON "market_listings" USING btree ("price");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "messages_external_id_idx" ON "messages" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" USING btree ("type");--> statement-breakpoint
CREATE INDEX "properties_operation_idx" ON "properties" USING btree ("operation");--> statement-breakpoint
CREATE INDEX "properties_city_idx" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX "properties_price_idx" ON "properties" USING btree ("price");--> statement-breakpoint
CREATE INDEX "properties_user_idx" ON "properties" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "property_images_property_idx" ON "property_images" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_tags_property_idx" ON "property_tags" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "property_tags_tag_idx" ON "property_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "social_accounts_user_idx" ON "social_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_accounts_platform_user_idx" ON "social_accounts" USING btree ("platform","user_id");--> statement-breakpoint
CREATE INDEX "social_accounts_platform_account_idx" ON "social_accounts" USING btree ("platform","platform_account_id");--> statement-breakpoint
CREATE INDEX "tags_user_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "tasks_completed_idx" ON "tasks" USING btree ("completed");