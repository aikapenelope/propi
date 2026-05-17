import { createHmac } from "crypto";

/**
 * Signed unsubscribe tokens for email compliance (CAN-SPAM, GDPR).
 *
 * Each marketing email includes an unsubscribe link with a signed token:
 *   /api/unsubscribe?token=<contactId>.<hmac>
 *
 * The HMAC prevents forged unsubscribe requests. No auth is needed —
 * the token itself proves the recipient received the email.
 */

function getSecret(): string {
  // Reuse CRON_SECRET as the HMAC key (already a random secret in the env).
  // This avoids adding yet another env var.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("CRON_SECRET is required for unsubscribe token signing");
  }
  return secret;
}

/** Generate a signed unsubscribe token for a contact. */
export function createUnsubscribeToken(contactId: string): string {
  const hmac = createHmac("sha256", getSecret())
    .update(contactId)
    .digest("hex")
    .slice(0, 32); // 32 hex chars = 128 bits, sufficient for HMAC verification
  return `${contactId}.${hmac}`;
}

/** Verify and extract the contactId from a signed unsubscribe token. */
export function verifyUnsubscribeToken(
  token: string,
): { valid: true; contactId: string } | { valid: false } {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return { valid: false };

  const contactId = token.slice(0, dotIndex);
  const providedHmac = token.slice(dotIndex + 1);

  const expectedHmac = createHmac("sha256", getSecret())
    .update(contactId)
    .digest("hex")
    .slice(0, 32);

  // Constant-time comparison to prevent timing attacks
  if (
    providedHmac.length !== expectedHmac.length ||
    !timingSafeCompare(providedHmac, expectedHmac)
  ) {
    return { valid: false };
  }

  return { valid: true, contactId };
}

/** Build the full unsubscribe URL for a contact. */
export function getUnsubscribeUrl(contactId: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://propi.aikalabs.cc";
  const token = createUnsubscribeToken(contactId);
  return `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** Build the unsubscribe HTML footer for marketing emails. */
export function getUnsubscribeFooter(contactId: string): string {
  const url = getUnsubscribeUrl(contactId);
  return (
    `<div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eee">` +
    `<p style="font-size:11px;color:#999;margin:0">` +
    `Si no deseas recibir mas correos, ` +
    `<a href="${url}" style="color:#999;text-decoration:underline">cancela tu suscripcion aqui</a>.` +
    `</p></div>`
  );
}

/** Constant-time string comparison. */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
