"use server";

import { db } from "@/lib/db";
import { contacts, contactTags, tags } from "@/server/schema";
import { eq, and, ilike, or, desc, lt, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";
import { requireUserId } from "@/lib/auth-helper";
import { sanitizeLike } from "@/lib/sanitize";
import { contactSchema, parseUuid } from "@/lib/validators";
import { logActivity } from "./activity-log";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContactFormData = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  source?: string;
  tagIds?: string[];
  /** Search preferences for property matching */
  prefPropertyType?: string;
  prefCity?: string;
  prefBudgetMax?: string;
  prefOperation?: string;
  birthDate?: string;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const CONTACTS_PAGE_SIZE = 30;

/** Paginated response */
export type PaginatedContacts = {
  items: Awaited<ReturnType<typeof fetchContacts>>;
  nextCursor: string | null;
  hasMore: boolean;
};

export async function getContacts(
  search?: string,
  cursor?: string,
): Promise<PaginatedContacts> {
  const userId = await requireUserId();

  const getCached = unstable_cache(
    () => fetchContacts(userId, search, cursor),
    [`contacts-${userId}-${search || "all"}-${cursor || "first"}`],
    { revalidate: 30, tags: [`contacts-${userId}`] },
  );

  const items = await getCached();
  const hasMore = items.length > CONTACTS_PAGE_SIZE;
  const trimmed = hasMore ? items.slice(0, CONTACTS_PAGE_SIZE) : items;
  const lastDate = trimmed[trimmed.length - 1]?.updatedAt;
  const nextCursor = hasMore && lastDate
    ? (lastDate instanceof Date ? lastDate : new Date(lastDate)).toISOString()
    : null;

  return { items: trimmed, nextCursor, hasMore };
}

async function fetchContacts(
  userId: string,
  search?: string,
  cursor?: string,
) {
  const conditions = search
    ? [
        eq(contacts.userId, userId),
        or(
          ilike(contacts.name, `%${sanitizeLike(search)}%`),
          ilike(contacts.email, `%${sanitizeLike(search)}%`),
          ilike(contacts.phone, `%${sanitizeLike(search)}%`),
          ilike(contacts.company, `%${sanitizeLike(search)}%`),
        ),
      ]
    : [eq(contacts.userId, userId)];

  if (cursor) {
    conditions.push(lt(contacts.updatedAt, new Date(cursor)));
  }

  return db.query.contacts.findMany({
    where: and(...conditions),
    with: {
      contactTags: {
        with: { tag: true },
      },
    },
    orderBy: [desc(contacts.updatedAt)],
    limit: CONTACTS_PAGE_SIZE + 1,
  });
}

/**
 * Lightweight list of all contacts for dropdowns/selects.
 * Returns only id + name + email + phone (no tags, no pagination).
 * Cached for 60s.
 */
export async function getContactOptions() {
  const userId = await requireUserId();

  const getCached = unstable_cache(
    () =>
      db.query.contacts.findMany({
        where: eq(contacts.userId, userId),
        columns: { id: true, name: true, email: true, phone: true },
        orderBy: [desc(contacts.updatedAt)],
        limit: 500,
      }),
    [`contact-options-${userId}`],
    { revalidate: 60, tags: [`contacts-${userId}`] },
  );

  return getCached();
}

export async function getContact(id: string) {
  parseUuid(id, "Contact ID");
  const userId = await requireUserId();

  return db.query.contacts.findFirst({
    where: and(eq(contacts.id, id), eq(contacts.userId, userId)),
    with: {
      contactTags: {
        with: { tag: true },
      },
      appointments: {
        orderBy: [desc(sql`starts_at`)],
        limit: 5,
      },
      documents: true,
    },
  });
}

export async function getTags() {
  const userId = await requireUserId();

  return db.query.tags.findMany({
    where: eq(tags.userId, userId),
    orderBy: [tags.name],
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createContact(data: ContactFormData) {
  const userId = await requireUserId();
  const validated = contactSchema.parse(data);

  const [contact] = await db
    .insert(contacts)
    .values({
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone || null,
      company: validated.company || null,
      notes: validated.notes || null,
      source: validated.source || "other",
      prefPropertyType: validated.prefPropertyType || null,
      prefCity: validated.prefCity || null,
      prefBudgetMax: validated.prefBudgetMax || null,
      prefOperation: validated.prefOperation || null,
      birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
      userId,
    })
    .returning();

  // Link tags
  if (validated.tagIds && validated.tagIds.length > 0) {
    await db.insert(contactTags).values(
      validated.tagIds.map((tagId) => ({
        contactId: contact.id,
        tagId,
      })),
    );
  }

  revalidatePath("/contacts");
  revalidateTag(`contacts-${userId}`, "max");
  revalidateTag(`dashboard-${userId}`, "max");

  await logActivity({
    userId,
    contactId: contact.id,
    type: "contact_created",
    title: `Contacto creado: ${contact.name}`,
  });

  return contact;
}

export async function updateContact(id: string, data: ContactFormData) {
  parseUuid(id, "Contact ID");
  const userId = await requireUserId();
  const validated = contactSchema.parse(data);

  const contact = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(contacts)
      .set({
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        company: validated.company || null,
        notes: validated.notes || null,
        source: validated.source || "other",
        prefPropertyType: validated.prefPropertyType || null,
        prefCity: validated.prefCity || null,
        prefBudgetMax: validated.prefBudgetMax || null,
        prefOperation: validated.prefOperation || null,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
      })
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error("Contacto no encontrado.");
    }

    // Replace tags atomically: delete existing, insert new
    await tx.delete(contactTags).where(eq(contactTags.contactId, id));
    if (validated.tagIds && validated.tagIds.length > 0) {
      await tx.insert(contactTags).values(
        validated.tagIds.map((tagId) => ({
          contactId: id,
          tagId,
        })),
      );
    }

    return updated;
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidateTag(`contacts-${userId}`, "max");
  revalidateTag(`dashboard-${userId}`, "max");
  return contact;
}

export async function deleteContact(id: string) {
  parseUuid(id, "Contact ID");
  const userId = await requireUserId();
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
  revalidatePath("/contacts");
  revalidateTag(`contacts-${userId}`, "max");
}

export async function createTag(name: string, color?: string) {
  const userId = await requireUserId();
  const [tag] = await db
    .insert(tags)
    .values({ name, color: color || "#6366f1", userId })
    .returning();
  return tag;
}
