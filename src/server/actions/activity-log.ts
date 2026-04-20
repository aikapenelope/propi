"use server";

import { db } from "@/lib/db";
import { activityLog } from "@/server/schema";
import { eq, desc } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType =
  | "email_sent"
  | "appointment_created"
  | "appointment_completed"
  | "pipeline_moved"
  | "property_shared"
  | "note_added"
  | "contact_created"
  | "task_created"
  | "document_uploaded";

// ---------------------------------------------------------------------------
// Log an activity (called from other server actions, no auth needed)
// ---------------------------------------------------------------------------

export async function logActivity(data: {
  userId: string;
  contactId: string;
  type: ActivityType;
  title: string;
  metadata?: string;
}) {
  try {
    await db.insert(activityLog).values({
      userId: data.userId,
      contactId: data.contactId,
      type: data.type,
      title: data.title,
      metadata: data.metadata || null,
    });
  } catch {
    // Non-critical — don't fail the parent action if logging fails
  }
}

// ---------------------------------------------------------------------------
// Get activity timeline for a contact
// ---------------------------------------------------------------------------

export async function getContactActivities(contactId: string) {
  return db.query.activityLog.findMany({
    where: eq(activityLog.contactId, contactId),
    orderBy: [desc(activityLog.createdAt)],
    limit: 50,
  });
}
