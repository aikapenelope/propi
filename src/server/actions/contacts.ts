"use server";

import { db } from "@/lib/db";
import { contacts, contactTags, tags } from "@/server/schema";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getContacts(search?: string) {
  const query = db.query.contacts.findMany({
    with: {
      assignedAgent: true,
      contactTags: {
        with: { tag: true },
      },
    },
    orderBy: [desc(contacts.updatedAt)],
    ...(search
      ? {
          where: or(
            ilike(contacts.name, `%${search}%`),
            ilike(contacts.email, `%${search}%`),
            ilike(contacts.phone, `%${search}%`),
            ilike(contacts.company, `%${search}%`),
          ),
        }
      : {}),
  });

  return query;
}

export async function getContact(id: string) {
  return db.query.contacts.findFirst({
    where: eq(contacts.id, id),
    with: {
      assignedAgent: true,
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
  return db.query.tags.findMany({
    orderBy: [tags.name],
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createContact(data: ContactFormData) {
  const [contact] = await db
    .insert(contacts)
    .values({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
      source: (data.source as typeof contacts.$inferInsert.source) || "other",
    })
    .returning();

  // Link tags
  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(contactTags).values(
      data.tagIds.map((tagId) => ({
        contactId: contact.id,
        tagId,
      })),
    );
  }

  revalidatePath("/contacts");
  return contact;
}

export async function updateContact(id: string, data: ContactFormData) {
  const [contact] = await db
    .update(contacts)
    .set({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
      source: (data.source as typeof contacts.$inferInsert.source) || "other",
    })
    .where(eq(contacts.id, id))
    .returning();

  // Replace tags: delete existing, insert new
  await db.delete(contactTags).where(eq(contactTags.contactId, id));
  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(contactTags).values(
      data.tagIds.map((tagId) => ({
        contactId: id,
        tagId,
      })),
    );
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return contact;
}

export async function deleteContact(id: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/contacts");
}

export async function createTag(name: string, color?: string) {
  const [tag] = await db
    .insert(tags)
    .values({ name, color: color || "#6366f1" })
    .returning();
  return tag;
}
