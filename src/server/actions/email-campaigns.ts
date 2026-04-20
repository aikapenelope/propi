"use server";

import { db } from "@/lib/db";
import {
  emailCampaigns,
  contacts,
  contactTags,
} from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helper";
import { getUserResendKey } from "@/lib/resend-key";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getEmailCampaigns() {
  const userId = await requireUserId();

  return db.query.emailCampaigns.findMany({
    where: eq(emailCampaigns.userId, userId),
    with: { tag: true },
    orderBy: [desc(emailCampaigns.createdAt)],
  });
}

export async function getEmailCampaign(id: string) {
  const userId = await requireUserId();

  return db.query.emailCampaigns.findFirst({
    where: and(eq(emailCampaigns.id, id), eq(emailCampaigns.userId, userId)),
    with: {
      tag: true,
      recipients: {
        with: { contact: true },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Create campaign (draft)
// ---------------------------------------------------------------------------

export async function createEmailCampaign(data: {
  subject: string;
  htmlBody: string;
  tagId?: string;
}) {
  const userId = await requireUserId();

  const [campaign] = await db
    .insert(emailCampaigns)
    .values({
      subject: data.subject,
      htmlBody: data.htmlBody,
      tagId: data.tagId || null,
      userId,
    })
    .returning();

  revalidatePath("/marketing/email");
  return campaign;
}

// ---------------------------------------------------------------------------
// Send campaign (enqueues to BullMQ, returns immediately)
// ---------------------------------------------------------------------------

export async function sendEmailCampaign(campaignId: string) {
  const userId = await requireUserId();

  const campaign = await db.query.emailCampaigns.findFirst({
    where: and(
      eq(emailCampaigns.id, campaignId),
      eq(emailCampaigns.userId, userId),
    ),
    with: { tag: true },
  });

  if (!campaign) throw new Error("Campana no encontrada.");
  if (campaign.status !== "draft") {
    throw new Error("Solo se pueden enviar campanas en estado borrador.");
  }

  // Resolve recipients now so we can validate before enqueuing
  let recipientContacts: { id: string; email: string | null; name: string }[];

  if (campaign.tagId) {
    const tagged = await db.query.contactTags.findMany({
      where: eq(contactTags.tagId, campaign.tagId),
      with: { contact: true },
    });
    recipientContacts = tagged
      .map((ct) => ct.contact)
      .filter((c) => c.email && c.userId === userId);
  } else {
    recipientContacts = await db.query.contacts.findMany({
      where: eq(contacts.userId, userId),
    });
    recipientContacts = recipientContacts.filter((c) => c.email);
  }

  if (recipientContacts.length === 0) {
    throw new Error("No hay contactos con email en este segmento.");
  }

  // Mark as sending
  await db
    .update(emailCampaigns)
    .set({ status: "sending" })
    .where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.userId, userId)));

  // Enqueue to BullMQ — the worker handles the actual sending.
  // This returns in ~1ms instead of blocking for N * sendEmail() calls.
  const { emailCampaignQueue } = await import("@/lib/queue");
  const userResendKey = await getUserResendKey(userId);
  await emailCampaignQueue.add("send", {
    campaignId,
    userId,
    resendApiKey: userResendKey || undefined,
    recipients: recipientContacts.map((c) => ({
      id: c.id,
      email: c.email!,
    })),
    subject: campaign.subject,
    htmlBody: campaign.htmlBody,
  });

  revalidatePath("/marketing/email");
  return { enqueued: true, total: recipientContacts.length };
}
