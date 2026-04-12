"use server";

import { db } from "@/lib/db";
import { contacts } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@/lib/pipeline-config";

// ---------------------------------------------------------------------------
// Get contacts grouped by lead status (for Kanban)
// ---------------------------------------------------------------------------

export async function getPipelineContacts() {
  const userId = await requireUserId();

  const allContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    with: { contactTags: { with: { tag: true } } },
    orderBy: (contacts, { desc }) => [desc(contacts.updatedAt)],
  });

  // Group by leadStatus
  const grouped: Record<LeadStatus, typeof allContacts> = {
    new: [],
    contacted: [],
    qualified: [],
    showing: [],
    offer: [],
    closed: [],
    lost: [],
  };

  for (const contact of allContacts) {
    const status = (contact.leadStatus as LeadStatus) || "new";
    if (grouped[status]) {
      grouped[status].push(contact);
    }
  }

  return grouped;
}

// ---------------------------------------------------------------------------
// Update lead status (drag & drop)
// ---------------------------------------------------------------------------

export async function updateLeadStatus(
  contactId: string,
  newStatus: LeadStatus,
) {
  const userId = await requireUserId();

  await db
    .update(contacts)
    .set({ leadStatus: newStatus })
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

  revalidatePath("/pipeline");
}
