"use server";

import { graphApiFetch } from "@/lib/meta-api";
import { getSocialAccount } from "./social-accounts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getWaToken() {
  const account = await getSocialAccount("whatsapp");
  if (!account)
    throw new Error(
      "WhatsApp no esta conectado. Ve a Configuracion y agrega tu Phone Number ID y access token de Meta.",
    );
  return { token: account.accessToken, phoneNumberId: account.platformAccountId };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WaSendResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

// ---------------------------------------------------------------------------
// Send a free-form text message (only within 24h customer service window)
// ---------------------------------------------------------------------------

export async function sendWhatsAppText(to: string, body: string) {
  const { token, phoneNumberId } = await getWaToken();

  return graphApiFetch<WaSendResponse>(
    `/${phoneNumberId}/messages`,
    token,
    {
      method: "POST",
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Send a template message (can be sent outside the 24h window)
// ---------------------------------------------------------------------------

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = "es",
  components?: Record<string, unknown>[],
) {
  const { token, phoneNumberId } = await getWaToken();

  const templateBody: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };

  if (components) {
    (templateBody.template as Record<string, unknown>).components = components;
  }

  return graphApiFetch<WaSendResponse>(
    `/${phoneNumberId}/messages`,
    token,
    { method: "POST", body: templateBody },
  );
}

// ---------------------------------------------------------------------------
// Mark a message as read
// ---------------------------------------------------------------------------

export async function markWhatsAppMessageRead(messageId: string) {
  const { token, phoneNumberId } = await getWaToken();

  return graphApiFetch<{ success: boolean }>(
    `/${phoneNumberId}/messages`,
    token,
    {
      method: "POST",
      body: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
    },
  );
}
