import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Force dynamic - never pre-render this route at build time
export const dynamic = "force-dynamic";

/**
 * Meta Webhook endpoint for receiving inbound messages from:
 * - Instagram DMs (messaging webhook)
 * - Facebook Messenger (messaging webhook)
 * - WhatsApp Cloud API (messages webhook)
 *
 * Configure this URL in your Meta App Dashboard:
 *   https://your-domain.com/api/webhooks/meta
 *
 * Required env var: META_WEBHOOK_VERIFY_TOKEN
 */

// ---------------------------------------------------------------------------
// GET: Webhook verification (Meta sends this when you register the webhook)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST: Receive inbound messages
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Validate HMAC signature from Meta
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET;

  const rawBody = await request.text();

  if (appSecret && signature) {
    const expectedSig =
      "sha256=" +
      crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    if (signature !== expectedSig) {
      console.error("Webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  // Dynamic import to avoid DB initialization at build time
  const { findOrCreateConversation, storeInboundMessage } = await import(
    "@/server/actions/messaging"
  );

  try {
    const body = JSON.parse(rawBody);
    const object = body.object as string;

    if (object === "whatsapp_business_account") {
      await handleWhatsAppWebhook(body, findOrCreateConversation, storeInboundMessage);
    } else if (object === "instagram") {
      await handleInstagramWebhook(body, findOrCreateConversation, storeInboundMessage);
    } else if (object === "page") {
      await handleFacebookWebhook(body, findOrCreateConversation, storeInboundMessage);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to Meta so they don't retry
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// Types for messaging actions
// ---------------------------------------------------------------------------

type FindOrCreate = (data: {
  platform: "instagram" | "facebook" | "whatsapp";
  externalId?: string;
  participantName?: string;
  participantExternalId: string;
  contactId?: string;
}) => Promise<{ id: string }>;

type StoreInbound = (
  conversationId: string,
  body: string,
  externalId?: string,
  metadata?: string,
) => Promise<unknown>;

// ---------------------------------------------------------------------------
// WhatsApp Cloud API webhook handler
// ---------------------------------------------------------------------------

interface WaWebhookEntry {
  changes: {
    value: {
      messages?: {
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: { body: string };
      }[];
      contacts?: { profile: { name: string }; wa_id: string }[];
      statuses?: { id: string; status: string }[];
    };
  }[];
}

async function handleWhatsAppWebhook(
  body: { entry: WaWebhookEntry[] },
  findOrCreateConversation: FindOrCreate,
  storeInboundMessage: StoreInbound,
) {
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const value = change.value;

      if (value.messages) {
        for (const msg of value.messages) {
          const contactName =
            value.contacts?.find((c) => c.wa_id === msg.from)?.profile.name ||
            msg.from;

          const convo = await findOrCreateConversation({
            platform: "whatsapp",
            participantExternalId: msg.from,
            participantName: contactName,
          });

          const textBody =
            msg.type === "text" ? msg.text?.body || "" : `[${msg.type}]`;

          await storeInboundMessage(
            convo.id,
            textBody,
            msg.id,
            JSON.stringify({ type: msg.type, timestamp: msg.timestamp }),
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Instagram messaging webhook handler
// ---------------------------------------------------------------------------

interface IgWebhookEntry {
  messaging?: {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: { mid: string; text?: string };
  }[];
}

async function handleInstagramWebhook(
  body: { entry: IgWebhookEntry[] },
  findOrCreateConversation: FindOrCreate,
  storeInboundMessage: StoreInbound,
) {
  for (const entry of body.entry) {
    if (!entry.messaging) continue;

    for (const event of entry.messaging) {
      if (!event.message) continue;

      const convo = await findOrCreateConversation({
        platform: "instagram",
        participantExternalId: event.sender.id,
      });

      await storeInboundMessage(
        convo.id,
        event.message.text || "[media]",
        event.message.mid,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Facebook Messenger webhook handler
// ---------------------------------------------------------------------------

interface FbWebhookEntry {
  messaging?: {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: { mid: string; text?: string };
  }[];
}

async function handleFacebookWebhook(
  body: { entry: FbWebhookEntry[] },
  findOrCreateConversation: FindOrCreate,
  storeInboundMessage: StoreInbound,
) {
  for (const entry of body.entry) {
    if (!entry.messaging) continue;

    for (const event of entry.messaging) {
      if (!event.message) continue;

      const convo = await findOrCreateConversation({
        platform: "facebook",
        participantExternalId: event.sender.id,
      });

      await storeInboundMessage(
        convo.id,
        event.message.text || "[media]",
        event.message.mid,
      );
    }
  }
}
