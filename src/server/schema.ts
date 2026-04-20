import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  index,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Property type: apartment, house, land, commercial, office, warehouse */
export const propertyTypeEnum = pgEnum("property_type", [
  "apartment",
  "house",
  "land",
  "commercial",
  "office",
  "warehouse",
  "other",
]);

/** Operation: sale, rent, or both */
export const operationEnum = pgEnum("operation", ["sale", "rent", "sale_rent"]);

/** Property listing status */
export const propertyStatusEnum = pgEnum("property_status", [
  "draft",
  "active",
  "reserved",
  "sold",
  "rented",
  "inactive",
]);

/** Lead pipeline status */
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "showing",
  "offer",
  "closed",
  "lost",
]);

/** Contact source: how the lead arrived */
export const contactSourceEnum = pgEnum("contact_source", [
  "website",
  "referral",
  "instagram",
  "facebook",
  "whatsapp",
  "portal",
  "walk_in",
  "phone",
  "other",
]);

/** Appointment status */
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

/** Document type */
export const documentTypeEnum = pgEnum("document_type", [
  "contract",
  "id_copy",
  "deed",
  "appraisal",
  "floor_plan",
  "invoice",
  "other",
]);

// ---------------------------------------------------------------------------
// Tags (shared between contacts and properties)
// ---------------------------------------------------------------------------

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("tags_user_idx").on(table.userId),
]);

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),
    notes: text("notes"),
    source: contactSourceEnum("source").default("other"),
    leadStatus: leadStatusEnum("lead_status").notNull().default("new"),
    /** Birthday for reminder notifications (month + day only) */
    birthDate: timestamp("birth_date", { withTimezone: true }),
    /** Search preferences for property matching */
    prefPropertyType: propertyTypeEnum("pref_property_type"),
    prefCity: varchar("pref_city", { length: 255 }),
    prefBudgetMax: numeric("pref_budget_max", { precision: 14, scale: 2 }),
    prefOperation: operationEnum("pref_operation"),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("contacts_name_idx").on(table.name),
    index("contacts_email_idx").on(table.email),
    index("contacts_user_idx").on(table.userId),
    index("contacts_lead_status_idx").on(table.leadStatus),
  ],
);

/** Many-to-many: contacts <-> tags */
export const contactTags = pgTable(
  "contact_tags",
  {
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.contactId, table.tagId] }),
    index("contact_tags_contact_idx").on(table.contactId),
    index("contact_tags_tag_idx").on(table.tagId),
  ],
);

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    type: propertyTypeEnum("type").notNull().default("apartment"),
    operation: operationEnum("operation").notNull().default("sale"),
    status: propertyStatusEnum("status").notNull().default("draft"),
    /** Price in the smallest currency unit or as decimal */
    price: numeric("price", { precision: 14, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("USD"),
    /** Area in square meters */
    area: numeric("area", { precision: 10, scale: 2 }),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    parkingSpaces: integer("parking_spaces"),
    /** Address fields */
    address: text("address"),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 255 }),
    zipCode: varchar("zip_code", { length: 20 }),
    country: varchar("country", { length: 100 }).default("VE"),
    /** GPS coordinates */
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    /** External publication IDs: { ml: "MLV123", wasi: "456" } */
    externalIds: jsonb("external_ids"),
    /** External listing links (up to 3): ["https://wasi.co/...", "https://mercadolibre.com.ve/..."] */
    externalLinks: jsonb("external_links"),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("properties_status_idx").on(table.status),
    index("properties_type_idx").on(table.type),
    index("properties_operation_idx").on(table.operation),
    index("properties_city_idx").on(table.city),
    index("properties_price_idx").on(table.price),
    index("properties_user_idx").on(table.userId),
  ],
);

/** Property images stored in MinIO (propi-media bucket) */
export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    /** S3/MinIO object key */
    key: text("key").notNull(),
    /** Original filename */
    filename: varchar("filename", { length: 500 }),
    /** Display order */
    sortOrder: integer("sort_order").default(0),
    /** Whether this is the cover image */
    isCover: boolean("is_cover").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("property_images_property_idx").on(table.propertyId)],
);

/** Many-to-many: properties <-> tags */
export const propertyTags = pgTable(
  "property_tags",
  {
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.propertyId, table.tagId] }),
    index("property_tags_property_idx").on(table.propertyId),
    index("property_tags_tag_idx").on(table.tagId),
  ],
);

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    /** When the appointment starts */
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    /** When the appointment ends */
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    /** Location (address or virtual link) */
    location: text("location"),
    /** Linked contact (optional) */
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    /** Linked property (optional) */
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("appointments_starts_at_idx").on(table.startsAt),
    index("appointments_contact_idx").on(table.contactId),
    index("appointments_property_idx").on(table.propertyId),
    index("appointments_user_idx").on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 500 }).notNull(),
    type: documentTypeEnum("type").default("other"),
    /** S3/MinIO object key in propi-documents bucket */
    key: text("key").notNull(),
    /** Original filename */
    filename: varchar("filename", { length: 500 }),
    /** File size in bytes */
    sizeBytes: integer("size_bytes"),
    /** MIME type */
    mimeType: varchar("mime_type", { length: 255 }),
    /** Linked contact (optional) */
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    /** Linked property (optional) */
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("documents_contact_idx").on(table.contactId),
    index("documents_property_idx").on(table.propertyId),
    index("documents_user_idx").on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// Social Accounts (Instagram, Facebook tokens from Meta Developer Dashboard)
// ---------------------------------------------------------------------------

export const socialPlatformEnum = pgEnum("social_platform", [
  "instagram",
  "facebook",
  "whatsapp",
  "mercadolibre",
  "wasi",
  "resend",
]);

export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: socialPlatformEnum("platform").notNull(),
  /** Long-lived access token from Meta Developer Dashboard */
  accessToken: text("access_token").notNull(),
  /** For token refresh */
  refreshToken: text("refresh_token"),
  /** Instagram Business Account ID or Facebook Page ID */
  platformAccountId: varchar("platform_account_id", { length: 255 }).notNull(),
  /** Display name (e.g. @propi_realestate) */
  accountName: varchar("account_name", { length: 255 }),
  /** When the token expires (long-lived = 60 days) */
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  /** Extra platform-specific data (e.g. MeLi refresh token, user ID) */
  metadata: jsonb("metadata"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("social_accounts_user_idx").on(table.userId),
  index("social_accounts_platform_user_idx").on(table.platform, table.userId),
  index("social_accounts_platform_account_idx").on(table.platform, table.platformAccountId),
]);

// ---------------------------------------------------------------------------
// Email Campaigns
// ---------------------------------------------------------------------------

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "failed",
]);

export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subject: varchar("subject", { length: 500 }).notNull(),
    htmlBody: text("html_body").notNull(),
    /** Send to contacts with this tag (segment) */
    tagId: uuid("tag_id").references(() => tags.id, { onDelete: "set null" }),
    status: campaignStatusEnum("status").notNull().default("draft"),
    sentCount: integer("sent_count").default(0),
    failedCount: integer("failed_count").default(0),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("email_campaigns_status_idx").on(table.status),
    index("email_campaigns_user_idx").on(table.userId),
  ],
);

export const campaignRecipients = pgTable(
  "campaign_recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => emailCampaigns.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    /** delivered, bounced, opened, etc. */
    status: varchar("status", { length: 50 }).default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => [
    index("campaign_recipients_campaign_idx").on(table.campaignId),
    index("campaign_recipients_contact_idx").on(table.contactId),
  ],
);

// ---------------------------------------------------------------------------
// Unified Conversations & Messages (Instagram DMs, Facebook Messenger, WhatsApp)
// ---------------------------------------------------------------------------

export const messageDirectionEnum = pgEnum("message_direction", [
  "inbound",
  "outbound",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Which channel: instagram, facebook, whatsapp */
    platform: socialPlatformEnum("platform").notNull(),
    /** Platform-specific conversation/thread ID */
    externalId: varchar("external_id", { length: 500 }),
    /** Linked CRM contact (optional, matched by phone/name) */
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    /** Name of the external participant */
    participantName: varchar("participant_name", { length: 255 }),
    /** Platform user ID of the external participant */
    participantExternalId: varchar("participant_external_id", { length: 255 }),
    /** Number of unread inbound messages */
    unreadCount: integer("unread_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    /** Last inbound message timestamp (for WhatsApp 24h window) */
    lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("conversations_platform_idx").on(table.platform),
    index("conversations_contact_idx").on(table.contactId),
    index("conversations_external_idx").on(table.externalId),
    index("conversations_last_msg_idx").on(table.lastMessageAt),
    index("conversations_user_idx").on(table.userId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: messageDirectionEnum("direction").notNull(),
    body: text("body"),
    /** Platform-specific message ID */
    externalId: varchar("external_id", { length: 500 }),
    status: messageStatusEnum("status").notNull().default("pending"),
    /** Extra data (media URLs, template info, etc.) stored as JSON string */
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_created_idx").on(table.createdAt),
    index("messages_external_id_idx").on(table.externalId),
  ],
);

// ---------------------------------------------------------------------------
// Relations (for Drizzle query builder)
// ---------------------------------------------------------------------------

export const contactsRelations = relations(contacts, ({ many }) => ({
  contactTags: many(contactTags),
  appointments: many(appointments),
  documents: many(documents),
  campaignRecipients: many(campaignRecipients),
  conversations: many(conversations),
  notes: many(contactNotes),
  activities: many(activityLog),
}));

export const contactTagsRelations = relations(contactTags, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactTags.contactId],
    references: [contacts.id],
  }),
  tag: one(tags, {
    fields: [contactTags.tagId],
    references: [tags.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  images: many(propertyImages),
  propertyTags: many(propertyTags),
  appointments: many(appointments),
  documents: many(documents),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const propertyTagsRelations = relations(propertyTags, ({ one }) => ({
  property: one(properties, {
    fields: [propertyTags.propertyId],
    references: [properties.id],
  }),
  tag: one(tags, {
    fields: [propertyTags.tagId],
    references: [tags.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  contact: one(contacts, {
    fields: [appointments.contactId],
    references: [contacts.id],
  }),
  property: one(properties, {
    fields: [appointments.propertyId],
    references: [properties.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  contact: one(contacts, {
    fields: [documents.contactId],
    references: [contacts.id],
  }),
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  contactTags: many(contactTags),
  propertyTags: many(propertyTags),
  emailCampaigns: many(emailCampaigns),
}));

export const emailCampaignsRelations = relations(
  emailCampaigns,
  ({ one, many }) => ({
    tag: one(tags, {
      fields: [emailCampaigns.tagId],
      references: [tags.id],
    }),
    recipients: many(campaignRecipients),
  }),
);

export const campaignRecipientsRelations = relations(
  campaignRecipients,
  ({ one }) => ({
    campaign: one(emailCampaigns, {
      fields: [campaignRecipients.campaignId],
      references: [emailCampaigns.id],
    }),
    contact: one(contacts, {
      fields: [campaignRecipients.contactId],
      references: [contacts.id],
    }),
  }),
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    contact: one(contacts, {
      fields: [conversations.contactId],
      references: [contacts.id],
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// ---------------------------------------------------------------------------
// Market Listings (centralized property database from MercadoLibre)
// ---------------------------------------------------------------------------

/** Centralized table of all properties fetched from MercadoLibre.
 *  Single source of truth for market data. Grows daily via cron sync.
 *  KPIs are calculated with SQL queries against this table, not LLM. */
export const marketListings = pgTable(
  "market_listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull().unique(),
    source: text("source").notNull().default("mercadolibre"),
    siteId: text("site_id").notNull().default("MLV"),
    title: text("title"),
    price: numeric("price"),
    currency: text("currency"),
    areaM2: numeric("area_m2"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    parking: integer("parking"),
    propertyType: text("property_type"),
    operation: text("operation"),
    city: text("city"),
    state: text("state"),
    neighborhood: text("neighborhood"),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    condition: text("condition"),
    permalink: text("permalink"),
    thumbnail: text("thumbnail"),
    sellerNickname: text("seller_nickname"),
    publishedAt: timestamp("published_at"),
    lastSeenAt: timestamp("last_seen_at").defaultNow(),
    attributes: jsonb("attributes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("market_listings_external_idx").on(table.externalId),
    index("market_listings_type_op_idx").on(table.propertyType, table.operation),
    index("market_listings_city_hood_idx").on(table.city, table.neighborhood),
    index("market_listings_published_idx").on(table.publishedAt),
    index("market_listings_price_idx").on(table.price),
    /** Composite index for KPI queries that filter by city + type + operation + neighborhood */
    index("market_listings_kpi_idx").on(table.city, table.propertyType, table.operation, table.neighborhood),
  ],
);

// ---------------------------------------------------------------------------
// Magic Searches (Propi Magic chat history + zone results)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Contact Notes (activity timeline per contact)
// ---------------------------------------------------------------------------

export const contactNotes = pgTable(
  "contact_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contact_notes_contact_idx").on(table.contactId),
    index("contact_notes_user_idx").on(table.userId),
    index("contact_notes_created_idx").on(table.createdAt),
  ],
);

export const contactNotesRelations = relations(contactNotes, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactNotes.contactId],
    references: [contacts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Tasks & Reminders
// ---------------------------------------------------------------------------

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    notes: text("notes"),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tasks_user_idx").on(table.userId),
    index("tasks_due_idx").on(table.dueAt),
    index("tasks_completed_idx").on(table.completed),
  ],
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
  property: one(properties, {
    fields: [tasks.propertyId],
    references: [properties.id],
  }),
}));

// ---------------------------------------------------------------------------
// Drip Campaigns (automated email sequences)
// ---------------------------------------------------------------------------

export const dripSequences = pgTable(
  "drip_sequences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    /** JSON array of steps: [{ delayDays: number, subject: string, body: string }] */
    steps: jsonb("steps").notNull().default([]),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("drip_sequences_user_idx").on(table.userId),
  ],
);

export const dripEnrollments = pgTable(
  "drip_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => dripSequences.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    currentStep: integer("current_step").notNull().default(0),
    /** When the next step should be sent */
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("drip_enrollments_sequence_idx").on(table.sequenceId),
    index("drip_enrollments_contact_idx").on(table.contactId),
    index("drip_enrollments_next_run_idx").on(table.nextRunAt),
    index("drip_enrollments_user_idx").on(table.userId),
  ],
);

export const dripSequencesRelations = relations(dripSequences, ({ many }) => ({
  enrollments: many(dripEnrollments),
}));

export const dripEnrollmentsRelations = relations(dripEnrollments, ({ one }) => ({
  sequence: one(dripSequences, {
    fields: [dripEnrollments.sequenceId],
    references: [dripSequences.id],
  }),
  contact: one(contacts, {
    fields: [dripEnrollments.contactId],
    references: [contacts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Magic Searches (Propi Magic chat history + zone results)
// ---------------------------------------------------------------------------
export const magicSearches = pgTable(
  "magic_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    /** The original user query text */
    query: text("query").notNull(),
    /** Parsed search parameters (JSON) */
    params: jsonb("params").notNull(),
    /** KPIs snapshot at search time */
    kpis: jsonb("kpis"),
    /** Chat messages (JSON array of {role, content}) */
    messages: jsonb("messages").notNull().default([]),
    /** Total results before dedup */
    totalResults: integer("total_results"),
    /** Results after dedup */
    dedupResults: integer("dedup_results"),
    /** Zone label for display */
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("magic_searches_user_idx").on(table.userId),
    index("magic_searches_created_idx").on(table.createdAt),
  ],
);

export const magicSearchesRelations = relations(magicSearches, () => ({
  // No FKs — userId is a Clerk ID, not a DB reference.
  // Relation block exists so Drizzle query builder recognizes the table.
}));

// ---------------------------------------------------------------------------
// Activity Log (automatic timeline per contact)
// ---------------------------------------------------------------------------

export const activityTypeEnum = pgEnum("activity_type", [
  "email_sent",
  "appointment_created",
  "appointment_completed",
  "pipeline_moved",
  "property_shared",
  "note_added",
  "contact_created",
  "task_created",
  "document_uploaded",
]);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    /** Extra context (property name, pipeline stage, etc.) */
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_log_contact_idx").on(table.contactId),
    index("activity_log_user_idx").on(table.userId),
    index("activity_log_created_idx").on(table.createdAt),
  ],
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  contact: one(contacts, {
    fields: [activityLog.contactId],
    references: [contacts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Notifications (in-app alerts for agents)
// ---------------------------------------------------------------------------

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment_reminder",
  "task_overdue",
  "birthday",
  "campaign_complete",
  "system",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    /** Link to navigate to when clicked (e.g. /calendar, /contacts/uuid) */
    link: text("link"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.read),
    index("notifications_created_idx").on(table.createdAt),
  ],
);

export const notificationsRelations = relations(notifications, () => ({}));
