import { Resend } from "resend";

/**
 * Email sending via Resend.
 *
 * Priority for API key:
 * 1. Per-user key passed via `apiKey` param (from socialAccounts)
 * 2. Global env var RESEND_API_KEY (fallback for system emails)
 *
 * Each user can configure their own Resend API key in Settings,
 * giving them their own 3,000 emails/month free tier.
 */

/** Cache Resend clients by API key to avoid re-creating on every call. */
const clientCache = new Map<string, Resend>();

function getResend(apiKey?: string): Resend {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "No hay API key de Resend configurada. Ve a Configuracion para agregar tu key, o contacta al administrador.",
    );
  }

  const cached = clientCache.get(key);
  if (cached) return cached;

  const client = new Resend(key);
  clientCache.set(key, client);
  return client;
}

export function getMailFrom(): string {
  return process.env.MAIL_FROM || "Propi <noreply@propi.aikalabs.cc>";
}

/**
 * Send an email via Resend.
 * Pass `apiKey` to use a per-user Resend key instead of the global one.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  /** Per-user Resend API key. Falls back to RESEND_API_KEY env var. */
  apiKey?: string;
}): Promise<{ id: string }> {
  const resend = getResend(params.apiKey);

  const { data, error } = await resend.emails.send({
    from: params.from || getMailFrom(),
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return { id: data?.id || "" };
}
