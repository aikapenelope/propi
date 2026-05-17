import { z } from "zod";

/**
 * Zod schemas for runtime validation of server action inputs.
 *
 * TypeScript types only exist at compile time — a malicious client can send
 * anything. These schemas validate at the server action boundary.
 *
 * Usage in server actions:
 *   const data = contactSchema.parse(rawInput);
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const optionalString = z
  .string()
  .transform((v) => (v.trim() === "" ? undefined : v.trim()))
  .optional();

const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal("").transform(() => undefined));

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  email: optionalString.pipe(z.string().email().optional().or(z.undefined())),
  phone: optionalString.pipe(z.string().max(50).optional().or(z.undefined())),
  company: optionalString.pipe(
    z.string().max(255).optional().or(z.undefined()),
  ),
  notes: optionalString,
  source: z
    .enum([
      "website",
      "referral",
      "instagram",
      "facebook",
      "whatsapp",
      "portal",
      "walk_in",
      "phone",
      "other",
    ])
    .optional()
    .default("other"),
  tagIds: z.array(uuidSchema).optional(),
  prefPropertyType: z
    .enum([
      "apartment",
      "house",
      "land",
      "commercial",
      "office",
      "warehouse",
      "other",
    ])
    .optional(),
  prefCity: optionalString,
  prefBudgetMax: optionalString,
  prefOperation: z.enum(["sale", "rent", "sale_rent", "sell", "lease"]).optional(),
  birthDate: optionalString,
});

export type ValidatedContactData = z.infer<typeof contactSchema>;

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export const propertySchema = z.object({
  title: z.string().min(1, "El titulo es requerido").max(500),
  description: optionalString,
  type: z
    .enum([
      "apartment",
      "house",
      "land",
      "commercial",
      "office",
      "warehouse",
      "other",
    ])
    .optional()
    .default("apartment"),
  operation: z.enum(["sale", "rent", "sale_rent", "sell", "lease"]).optional().default("sale"),
  status: z
    .enum(["draft", "active", "reserved", "sold", "rented", "inactive"])
    .optional()
    .default("draft"),
  price: optionalString,
  currency: z.string().max(3).optional().default("USD"),
  area: optionalString,
  bedrooms: optionalString,
  bathrooms: optionalString,
  parkingSpaces: optionalString,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: optionalString,
  country: z.string().max(100).optional().default("VE"),
  latitude: optionalString,
  longitude: optionalString,
  tagIds: z.array(uuidSchema).optional(),
  externalLinks: z.array(z.string().url()).max(3).optional(),
  closedAt: optionalString,
  soldPrice: optionalString,
  commissionRate: optionalString,
});

export type ValidatedPropertyData = z.infer<typeof propertySchema>;

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export const appointmentSchema = z
  .object({
    title: z.string().min(1, "El titulo es requerido").max(500),
    description: optionalString,
    startsAt: z.string().min(1, "La fecha de inicio es requerida"),
    endsAt: z.string().min(1, "La fecha de fin es requerida"),
    status: z
      .enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"])
      .optional()
      .default("scheduled"),
    location: optionalString,
    contactId: optionalUuid,
    propertyId: optionalUuid,
  })
  .refine(
    (data) => new Date(data.endsAt) > new Date(data.startsAt),
    "La fecha de fin debe ser posterior a la de inicio",
  );

export type ValidatedAppointmentData = z.infer<typeof appointmentSchema>;

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const taskSchema = z.object({
  title: z.string().min(1, "El titulo es requerido").max(500),
  dueAt: optionalString,
  contactId: optionalUuid,
  propertyId: optionalUuid,
});

export type ValidatedTaskData = z.infer<typeof taskSchema>;

// ---------------------------------------------------------------------------
// Email Campaigns
// ---------------------------------------------------------------------------

export const emailCampaignSchema = z.object({
  subject: z.string().min(1, "El asunto es requerido").max(500),
  htmlBody: z.string().min(1, "El contenido es requerido"),
  tagId: optionalUuid,
});

export type ValidatedEmailCampaignData = z.infer<typeof emailCampaignSchema>;

// ---------------------------------------------------------------------------
// Drip Sequences
// ---------------------------------------------------------------------------

export const dripStepSchema = z.object({
  delayDays: z.number().int().min(0, "El delay no puede ser negativo"),
  subject: z.string().min(1, "El asunto es requerido"),
  body: z.string().min(1, "El contenido es requerido"),
});

export const dripSequenceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  steps: z.array(dripStepSchema).min(1, "Agrega al menos un paso"),
});

export type ValidatedDripSequenceData = z.infer<typeof dripSequenceSchema>;

// ---------------------------------------------------------------------------
// Social Accounts
// ---------------------------------------------------------------------------

export const socialAccountSchema = z.object({
  platform: z.enum([
    "instagram",
    "facebook",
    "whatsapp",
    "mercadolibre",
    "wasi",
    "resend",
  ]),
  accessToken: z.string().min(1),
  platformAccountId: z.string().min(1).max(255),
  accountName: optionalString,
  refreshToken: optionalString,
  tokenExpiresAt: optionalString,
  metadata: z.record(z.string(), z.unknown()).optional(),
  userId: optionalString,
});

export type ValidatedSocialAccountData = z.infer<typeof socialAccountSchema>;

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export const documentSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(500),
  type: z
    .enum([
      "contract",
      "id_copy",
      "deed",
      "appraisal",
      "floor_plan",
      "invoice",
      "other",
    ])
    .optional()
    .default("other"),
  key: z.string().min(1),
  filename: z.string().min(1).max(500),
  sizeBytes: z.number().int().positive().optional(),
  mimeType: z.string().max(255).optional(),
  contactId: optionalUuid,
  propertyId: optionalUuid,
});

export type ValidatedDocumentData = z.infer<typeof documentSchema>;

// ---------------------------------------------------------------------------
// Metric Shares
// ---------------------------------------------------------------------------

export const metricShareSchema = z.object({
  brokerEmail: z.string().email("Email invalido"),
  permissions: z
    .object({
      pipeline: z.boolean(),
      transactions: z.boolean(),
      activity: z.boolean(),
      contactsCount: z.boolean(),
    })
    .optional(),
});

export type ValidatedMetricShareData = z.infer<typeof metricShareSchema>;

// ---------------------------------------------------------------------------
// Scheduled Reports
// ---------------------------------------------------------------------------

export const scheduledReportSchema = z.object({
  recipientEmail: z.string().email("Email invalido"),
  frequency: z.enum(["weekly", "monthly"]),
});

export type ValidatedScheduledReportData = z.infer<
  typeof scheduledReportSchema
>;
