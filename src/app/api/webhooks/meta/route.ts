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
 * Multi-tenant routing: resolves userId from platformAccountId in socialAccounts.
 * Each user connects their own IG/FB/WA account, so the platformAccountId
 * (phone_number_id for WA, recipient.id for IG/FB) maps to exactly one user.
 *
 * Required env vars: META_WEBHOOK_VERIFY_TOKEN, META_APP_SECRET
 */

// ---------------------------------------------------------------------------
// GET: Webhook verification
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
    const sigBuf = Buffer.from(signature, "utf8");
    const expectedBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      console.error("Webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  } else if (appSecret) {
    // META_APP_SECRET configured but no signature header = reject
    console.error("Webhook missing X-Hub-Signature-256 header");
    return NextResponse.json({ error: "Missing signature" }, { status: 403 });
  }

  // Dynamic imports to avoid DB initialization at build time
  const { findOrCreateConversation, storeInboundMessage } = await import(
    "@/server/actions/messaging"
  );
  const { resolveUserIdByPlatformAccount } = await import(
    "@/server/actions/social-accounts"
  );

  try {
    const body = JSON.parse(rawBody);
    const object = body.object as string;

    if (object === "whatsapp_business_account") {
      await handleWhatsAppWebhook(body, resolveUserIdByPlatformAccount, findOrCreateConversation, storeInboundMessage);
    } else if (object === "instagram") {
      await handleInstagramWebhook(body, resolveUserIdByPlatformAccount, findOrCreateConversation, storeInboundMessage);
    } else if (object === "page") {
      await handleFacebookWebhook(body, resolveUserIdByPlatformAccount, findOrCreateConversation, storeInboundMessage);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to Meta so they don't retry
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResolveUser = (
  platform: "instagram" | "facebook" | "whatsapp",
  platformAccountId: string,
) => Promise<string | null>;

type FindOrCreate = (data: {
  platform: "instagram" | "facebook" | "whatsapp";
  externalId?: string;
  participantName?: string;
  participantExternalId: string;
  contactId?: string;
  userId: string;
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
      metadata?: { phone_number_id: string };
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
  resolveUser: ResolveUser,
  findOrCreateConversation: FindOrCreate,
  storeInboundMessage: StoreInbound,
) {
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      if (!value.messages) continue;

      // Resolve user from phone_number_id
      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const userId = await resolveUser("whatsapp", phoneNumberId);
      if (!userId) {
        console.warn(`WA webhook: no user found for phone_number_id ${phoneNumberId}`);
        continue;
      }

      for (const msg of value.messages) {
        const contactName =
          value.contacts?.find((c) => c.wa_id === msg.from)?.profile.name ||
          msg.from;

        const convo = await findOrCreateConversation({
          platform: "whatsapp",
          participantExternalId: msg.from,
          participantName: contactName,
          userId,
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
  resolveUser: ResolveUser,
  findOrCreateConversation: FindOrCreate,
  storeInboundMessage: StoreInbound,
) {
  for (const entry of body.entry) {
    if (!entry.messaging) continue;

    for (const event of entry.messaging) {
      if (!event.message) continue;

      // recipient.id is the IG Business Account ID (our user's account)
      const userId = await resolveUser("instagram", event.recipient.id);
      if (!userId) {
        console.warn(`IG webhook: no user found for recipient ${event.recipient.id}`);
        continue;
      }

      const convo = await findOrCreateConversation({
        platform: "instagram",
        participantExternalId: event.sender.id,
        userId,
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
  resolveUser: ResolveUser,
  findOrCreateConversation: FindOrCreate,
  storeInboundMessage: StoreInbound,
) {
  for (const entry of body.entry) {
    if (!entry.messaging) continue;

    for (const event of entry.messaging) {
      if (!event.message) continue;

      // recipient.id is the Facebook Page ID (our user's page)
      const userId = await resolveUser("facebook", event.recipient.id);
      if (!userId) {
        console.warn(`FB webhook: no user found for recipient ${event.recipient.id}`);
        continue;
      }

      const convo = await findOrCreateConversation({
        platform: "facebook",
        participantExternalId: event.sender.id,
        userId,
      });

      await storeInboundMessage(
        convo.id,
        event.message.text || "[media]",
        event.message.mid,
      );
    }
  }
}
