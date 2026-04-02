"use server";

import { db } from "@/lib/db";
import {
  emailCampaigns,
  campaignRecipients,
  contacts,
  contactTags,
} from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail, getMailFrom } from "@/lib/mailer";
import { requireUserId } from "@/lib/auth-helper";

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
// Send campaign
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

  // Get recipients: user's contacts with email, filtered by tag if set
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

  const from = getMailFrom();
  let sentCount = 0;
  let failedCount = 0;

  for (const contact of recipientContacts) {
    try {
      await sendEmail({
        from,
        to: contact.email!,
        subject: campaign.subject,
        html: campaign.htmlBody,
      });

      await db.insert(campaignRecipients).values({
        campaignId,
        contactId: contact.id,
        status: "delivered",
        sentAt: new Date(),
      });

      sentCount++;
    } catch {
      await db.insert(campaignRecipients).values({
        campaignId,
        contactId: contact.id,
        status: "failed",
      });

      failedCount++;
    }
  }

  // Update campaign status
  await db
    .update(emailCampaigns)
    .set({
      status: failedCount === recipientContacts.length ? "failed" : "sent",
      sentCount,
      failedCount,
      sentAt: new Date(),
    })
    .where(eq(emailCampaigns.id, campaignId));

  revalidatePath("/marketing/email");
  return { sentCount, failedCount, total: recipientContacts.length };
}
