"use server";

import { db } from "@/lib/db";
import { contactNotes, contacts } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-log";

// ---------------------------------------------------------------------------
// Get notes for a contact
// ---------------------------------------------------------------------------

export async function getContactNotes(contactId: string) {
  const userId = await requireUserId();

  // Verify contact ownership
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
    columns: { id: true },
  });
  if (!contact) throw new Error("Contacto no encontrado");

  return db.query.contactNotes.findMany({
    where: eq(contactNotes.contactId, contactId),
    orderBy: [desc(contactNotes.createdAt)],
  });
}

// ---------------------------------------------------------------------------
// Add a note to a contact
// ---------------------------------------------------------------------------

export async function addContactNote(contactId: string, content: string) {
  const userId = await requireUserId();

  if (!content.trim()) throw new Error("La nota no puede estar vacia");

  // Verify contact ownership
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
    columns: { id: true },
  });
  if (!contact) throw new Error("Contacto no encontrado");

  const [note] = await db
    .insert(contactNotes)
    .values({
      contactId,
      userId,
      content: content.trim(),
    })
    .returning();

  revalidatePath(`/contacts/${contactId}`);

  await logActivity({
    userId,
    contactId,
    type: "note_added",
    title: "Nota agregada",
    metadata: content.trim().slice(0, 100),
  });

  return note;
}

// ---------------------------------------------------------------------------
// Delete a note
// ---------------------------------------------------------------------------

export async function deleteContactNote(noteId: string) {
  const userId = await requireUserId();

  await db
    .delete(contactNotes)
    .where(and(eq(contactNotes.id, noteId), eq(contactNotes.userId, userId)));

  revalidatePath("/contacts");
}
