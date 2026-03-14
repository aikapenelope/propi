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
  name: varchar("name", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Agents (Clerk user profiles extended with CRM data)
// ---------------------------------------------------------------------------

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Clerk user ID - links to auth system */
  clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"),
  /** Commission percentage (e.g. 3.5 = 3.5%) */
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).default(
    "3.00",
  ),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
    assignedAgentId: uuid("assigned_agent_id").references(() => agents.id),
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
    index("contacts_agent_idx").on(table.assignedAgentId),
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
    country: varchar("country", { length: 100 }).default("CO"),
    /** GPS coordinates */
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    /** Agent who listed this property */
    agentId: uuid("agent_id").references(() => agents.id),
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
    index("properties_agent_idx").on(table.agentId),
    index("properties_price_idx").on(table.price),
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
    contactId: uuid("contact_id").references(() => contacts.id),
    /** Linked property (optional) */
    propertyId: uuid("property_id").references(() => properties.id),
    /** Agent responsible */
    agentId: uuid("agent_id").references(() => agents.id),
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
    index("appointments_agent_idx").on(table.agentId),
    index("appointments_contact_idx").on(table.contactId),
    index("appointments_property_idx").on(table.propertyId),
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
    contactId: uuid("contact_id").references(() => contacts.id),
    /** Linked property (optional) */
    propertyId: uuid("property_id").references(() => properties.id),
    /** Who uploaded */
    agentId: uuid("agent_id").references(() => agents.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("documents_contact_idx").on(table.contactId),
    index("documents_property_idx").on(table.propertyId),
  ],
);

// ---------------------------------------------------------------------------
// Relations (for Drizzle query builder)
// ---------------------------------------------------------------------------

export const agentsRelations = relations(agents, ({ many }) => ({
  contacts: many(contacts),
  properties: many(properties),
  appointments: many(appointments),
  documents: many(documents),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  assignedAgent: one(agents, {
    fields: [contacts.assignedAgentId],
    references: [agents.id],
  }),
  contactTags: many(contactTags),
  appointments: many(appointments),
  documents: many(documents),
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

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  agent: one(agents, {
    fields: [properties.agentId],
    references: [agents.id],
  }),
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
  agent: one(agents, {
    fields: [appointments.agentId],
    references: [agents.id],
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
  agent: one(agents, {
    fields: [documents.agentId],
    references: [agents.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  contactTags: many(contactTags),
  propertyTags: many(propertyTags),
}));
