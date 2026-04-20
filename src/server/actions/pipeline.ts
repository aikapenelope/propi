"use server";

import { db } from "@/lib/db";
import { contacts } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@/lib/pipeline-config";
import { LEAD_STATUSES, LEAD_STATUS_CONFIG } from "@/lib/pipeline-config";
import { logActivity } from "./activity-log";

// ---------------------------------------------------------------------------
// Get contacts grouped by lead status (for Kanban)
// ---------------------------------------------------------------------------

/** Max contacts per pipeline column. Prevents loading 10K+ contacts at once. */
const PIPELINE_COLUMN_LIMIT = 100;

export async function getPipelineContacts() {
  const userId = await requireUserId();

  // Query each status in parallel with a per-column limit instead of
  // loading every contact and grouping in JS. With 7 statuses * 100 limit
  // the max is 700 contacts vs unbounded before.
  const results = await Promise.all(
    LEAD_STATUSES.map((status) =>
      db.query.contacts.findMany({
        where: and(
          eq(contacts.userId, userId),
          eq(contacts.leadStatus, status),
        ),
        with: { contactTags: { with: { tag: true } } },
        orderBy: [desc(contacts.updatedAt)],
        limit: PIPELINE_COLUMN_LIMIT,
      }),
    ),
  );

  const grouped = {} as Record<LeadStatus, (typeof results)[number]>;
  for (let i = 0; i < LEAD_STATUSES.length; i++) {
    grouped[LEAD_STATUSES[i]] = results[i];
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

  await logActivity({
    userId,
    contactId,
    type: "pipeline_moved",
    title: `Movido a ${LEAD_STATUS_CONFIG[newStatus].label}`,
  });

  revalidatePath("/pipeline");
}
