import { Resend } from "resend";

/**
 * Email sending via Resend.
 * 1 env var: RESEND_API_KEY (free tier: 3,000 emails/month)
 * Replaces Nodemailer SMTP (no more SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).
 */

let client: Resend | null = null;

function getResend(): Resend {
  if (client) return client;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY no esta configurado. Obten una API key gratis en resend.com.",
    );
  }

  client = new Resend(apiKey);
  return client;
}

export function getMailFrom(): string {
  return process.env.MAIL_FROM || "Propi <noreply@propi.aikalabs.cc>";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ id: string }> {
  const resend = getResend();

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
