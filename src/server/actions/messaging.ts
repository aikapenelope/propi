"use server";

import { db } from "@/lib/db";
import { conversations, messages } from "@/server/schema";
import { eq, desc, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendIgMessage } from "./instagram";
import { sendWhatsAppText } from "./whatsapp";
import { graphApiFetch } from "@/lib/meta-api";
import { getSocialAccount } from "./social-accounts";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getConversations(platform?: "instagram" | "facebook" | "whatsapp") {
  return db.query.conversations.findMany({
    where: platform ? eq(conversations.platform, platform) : undefined,
    with: {
      contact: true,
      messages: {
        orderBy: [desc(messages.createdAt)],
        limit: 1,
      },
    },
    orderBy: [desc(conversations.lastMessageAt)],
  });
}

export async function getConversation(id: string) {
  return db.query.conversations.findFirst({
    where: eq(conversations.id, id),
    with: {
      contact: true,
      messages: {
        orderBy: [desc(messages.createdAt)],
        limit: 50,
      },
    },
  });
}

export async function getMessages(conversationId: string, limit = 50) {
  return db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [desc(messages.createdAt)],
    limit,
  });
}

// ---------------------------------------------------------------------------
// Send message (routes to correct platform API)
// ---------------------------------------------------------------------------

export async function sendMessage(conversationId: string, body: string) {
  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (!convo) throw new Error("Conversacion no encontrada.");
  if (!convo.participantExternalId) {
    throw new Error("No se puede enviar: falta el ID del participante.");
  }

  let externalId: string | undefined;

  switch (convo.platform) {
    case "instagram": {
      const result = await sendIgMessage(convo.participantExternalId, body);
      externalId = result.id;
      break;
    }
    case "facebook": {
      const account = await getSocialAccount("facebook");
      if (!account) throw new Error("Facebook no esta conectado.");
      const result = await graphApiFetch<{ id: string }>(
        `/${account.platformAccountId}/messages`,
        account.accessToken,
        {
          method: "POST",
          body: {
            recipient: { id: convo.participantExternalId },
            message: { text: body },
          },
        },
      );
      externalId = result.id;
      break;
    }
    case "whatsapp": {
      const result = await sendWhatsAppText(convo.participantExternalId, body);
      externalId = result.messages[0]?.id;
      break;
    }
  }

  // Store outbound message
  const [msg] = await db
    .insert(messages)
    .values({
      conversationId,
      direction: "outbound",
      body,
      externalId: externalId || null,
      status: "sent",
    })
    .returning();

  // Update conversation lastMessageAt
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));

  revalidatePath("/marketing/inbox");
  return msg;
}

// ---------------------------------------------------------------------------
// Create or find conversation
// ---------------------------------------------------------------------------

export async function findOrCreateConversation(data: {
  platform: "instagram" | "facebook" | "whatsapp";
  externalId?: string;
  participantName?: string;
  participantExternalId: string;
  contactId?: string;
}) {
  // Try to find existing by platform + participant
  const existing = await db.query.conversations.findFirst({
    where: eq(conversations.participantExternalId, data.participantExternalId),
  });

  if (existing) return existing;

  const [convo] = await db
    .insert(conversations)
    .values({
      platform: data.platform,
      externalId: data.externalId || null,
      participantName: data.participantName || null,
      participantExternalId: data.participantExternalId,
      contactId: data.contactId || null,
      lastMessageAt: new Date(),
    })
    .returning();

  return convo;
}

// ---------------------------------------------------------------------------
// Store inbound message
// ---------------------------------------------------------------------------

export async function storeInboundMessage(
  conversationId: string,
  body: string,
  externalId?: string,
  metadata?: string,
) {
  const [msg] = await db
    .insert(messages)
    .values({
      conversationId,
      direction: "inbound",
      body,
      externalId: externalId || null,
      status: "delivered",
      metadata: metadata || null,
    })
    .returning();

  // Update lastMessageAt and increment unread count
  await db
    .update(conversations)
    .set({
      lastMessageAt: new Date(),
      unreadCount: sql`${conversations.unreadCount} + 1`,
    })
    .where(eq(conversations.id, conversationId));

  return msg;
}

// ---------------------------------------------------------------------------
// Mark conversation as read (reset unread count)
// ---------------------------------------------------------------------------

export async function markConversationRead(conversationId: string) {
  await db
    .update(conversations)
    .set({ unreadCount: 0 })
    .where(eq(conversations.id, conversationId));

  revalidatePath("/marketing/inbox");
}

// ---------------------------------------------------------------------------
// Cleanup: delete messages older than 90 days
// ---------------------------------------------------------------------------

export async function cleanupOldMessages() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  // Delete old messages
  const deleted = await db
    .delete(messages)
    .where(lt(messages.createdAt, cutoff))
    .returning({ id: messages.id });

  // Delete conversations that have no messages left
  const emptyConvos = await db.execute(sql`
    DELETE FROM conversations
    WHERE id NOT IN (
      SELECT DISTINCT conversation_id FROM messages
    )
  `);

  return {
    messagesDeleted: deleted.length,
    conversationsDeleted: emptyConvos,
  };
}

// ---------------------------------------------------------------------------
// Get total unread count across all conversations
// ---------------------------------------------------------------------------

export async function getTotalUnreadCount() {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${conversations.unreadCount}), 0)::int`,
    })
    .from(conversations);

  return result[0]?.total ?? 0;
}
