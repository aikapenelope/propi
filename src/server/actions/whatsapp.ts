"use server";

import { db } from "@/lib/db";
import { whatsappMessages, contacts, contactTags } from "@/server/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import twilio from "twilio";

// ---------------------------------------------------------------------------
// Twilio client (lazy init from env vars)
// ---------------------------------------------------------------------------

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error(
      "Twilio no esta configurado. Agrega TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en las variables de entorno.",
    );
  }
  return twilio(sid, token);
}

function getWhatsAppFrom() {
  const num = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!num) {
    throw new Error(
      "TWILIO_WHATSAPP_NUMBER no esta configurado en las variables de entorno.",
    );
  }
  return `whatsapp:${num}`;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getWhatsAppMessages(limit = 50) {
  return db.query.whatsappMessages.findMany({
    with: { contact: true },
    orderBy: [desc(whatsappMessages.createdAt)],
    limit,
  });
}

export async function getWhatsAppMessagesByContact(contactId: string) {
  return db.query.whatsappMessages.findMany({
    where: eq(whatsappMessages.contactId, contactId),
    orderBy: [desc(whatsappMessages.createdAt)],
  });
}

// ---------------------------------------------------------------------------
// Send message to a single contact
// ---------------------------------------------------------------------------

export async function sendWhatsAppMessage(
  contactId: string,
  body: string,
  template?: string,
) {
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId),
  });

  if (!contact?.phone) {
    throw new Error("El contacto no tiene numero de telefono.");
  }

  const client = getTwilioClient();
  const from = getWhatsAppFrom();

  const msg = await client.messages.create({
    body,
    from,
    to: `whatsapp:${contact.phone}`,
  });

  const [record] = await db
    .insert(whatsappMessages)
    .values({
      contactId,
      body,
      template: template || null,
      twilioSid: msg.sid,
      status: "sent",
      direction: "outbound",
      sentAt: new Date(),
    })
    .returning();

  revalidatePath("/marketing/whatsapp");
  return record;
}

// ---------------------------------------------------------------------------
// Send to a tag segment (all contacts with a given tag)
// ---------------------------------------------------------------------------

export async function sendWhatsAppToSegment(
  tagId: string,
  body: string,
  template?: string,
) {
  // Get all contacts with this tag
  const tagged = await db.query.contactTags.findMany({
    where: eq(contactTags.tagId, tagId),
    with: { contact: true },
  });

  const contactsWithPhone = tagged.filter((ct) => ct.contact.phone);

  if (contactsWithPhone.length === 0) {
    throw new Error("No hay contactos con telefono en este segmento.");
  }

  const client = getTwilioClient();
  const from = getWhatsAppFrom();
  const results: { contactId: string; status: string; sid?: string }[] = [];

  for (const ct of contactsWithPhone) {
    try {
      const msg = await client.messages.create({
        body,
        from,
        to: `whatsapp:${ct.contact.phone}`,
      });

      await db.insert(whatsappMessages).values({
        contactId: ct.contact.id,
        body,
        template: template || null,
        twilioSid: msg.sid,
        status: "sent",
        direction: "outbound",
        sentAt: new Date(),
      });

      results.push({
        contactId: ct.contact.id,
        status: "sent",
        sid: msg.sid,
      });
    } catch {
      await db.insert(whatsappMessages).values({
        contactId: ct.contact.id,
        body,
        template: template || null,
        status: "failed",
        direction: "outbound",
      });

      results.push({ contactId: ct.contact.id, status: "failed" });
    }
  }

  revalidatePath("/marketing/whatsapp");
  return {
    total: contactsWithPhone.length,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
}
