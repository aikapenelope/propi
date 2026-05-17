import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/server/schema";
import { eq } from "drizzle-orm";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

/**
 * Email unsubscribe endpoint (CAN-SPAM / GDPR compliance).
 *
 * GET /api/unsubscribe?token=<contactId>.<hmac>
 *
 * No authentication required — the signed token proves the recipient
 * received the email. Sets `unsubscribed_at` on the contact row.
 * All future marketing emails skip contacts with a non-null `unsubscribed_at`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(unsubscribeHtml("Token requerido.", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const result = verifyUnsubscribeToken(token);

  if (!result.valid) {
    return new Response(unsubscribeHtml("Enlace invalido o expirado.", false), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    await db
      .update(contacts)
      .set({ unsubscribedAt: new Date() })
      .where(eq(contacts.id, result.contactId));

    return new Response(
      unsubscribeHtml(
        "Tu suscripcion ha sido cancelada. No recibiras mas correos de marketing.",
        true,
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  } catch {
    return new Response(
      unsubscribeHtml("Error al procesar tu solicitud. Intenta de nuevo.", false),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

/** Simple HTML page for the unsubscribe confirmation. */
function unsubscribeHtml(message: string, success: boolean): string {
  const color = success ? "#059669" : "#dc2626";
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cancelar suscripcion — Propi</title></head>
<body style="margin:0;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f0;display:flex;justify-content:center;align-items:center;min-height:100vh">
  <div style="max-width:400px;text-align:center">
    <div style="font-size:48px;margin-bottom:16px">${success ? "✓" : "✕"}</div>
    <h1 style="font-size:20px;color:#0A2B1D;margin-bottom:8px">Propi</h1>
    <p style="font-size:16px;color:${color};line-height:1.5">${message}</p>
  </div>
</body>
</html>`;
}
