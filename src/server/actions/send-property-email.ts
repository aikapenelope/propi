"use server";

import { db } from "@/lib/db";
import { properties, propertyImages, contacts } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { sendEmail, getMailFrom } from "@/lib/mailer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  land: "Terreno",
  commercial: "Comercial",
  office: "Oficina",
  warehouse: "Bodega",
  other: "Otro",
};

const operationLabels: Record<string, string> = {
  sale: "Venta",
  rent: "Alquiler",
  sale_rent: "Venta / Alquiler",
};

// ---------------------------------------------------------------------------
// Send property sheet by email
// ---------------------------------------------------------------------------

/** Send a property listing sheet to one or more contacts by email. */
export async function sendPropertyByEmail(
  propertyId: string,
  contactIds: string[],
) {
  const userId = await requireUserId();

  if (contactIds.length === 0) {
    throw new Error("Selecciona al menos un contacto.");
  }
  if (contactIds.length > 10) {
    throw new Error("Maximo 10 contactos por envio.");
  }

  // Get property with images
  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, userId)),
    with: {
      images: { orderBy: [propertyImages.sortOrder], limit: 3 },
    },
  });

  if (!property) throw new Error("Propiedad no encontrada.");

  // Get contacts with email
  const recipientContacts = await db.query.contacts.findMany({
    where: and(eq(contacts.userId, userId)),
    columns: { id: true, name: true, email: true },
  });

  const recipients = recipientContacts.filter(
    (c) => c.email && contactIds.includes(c.id),
  );

  if (recipients.length === 0) {
    throw new Error("Ningun contacto seleccionado tiene email.");
  }

  // Build public URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://propi.aikalabs.cc";
  const publicUrl = `${baseUrl}/p/${property.id}`;

  // Format price
  const price = property.price
    ? new Intl.NumberFormat("es", {
        style: "currency",
        currency: property.currency || "USD",
        minimumFractionDigits: 0,
      }).format(parseFloat(property.price))
    : null;

  // Build cover image URL
  const coverImage = property.images[0];
  const coverUrl = coverImage ? `${baseUrl}/api/images/${coverImage.key}` : null;

  // Build specs line
  const specs = [
    typeLabels[property.type] ?? property.type,
    property.bedrooms != null ? `${property.bedrooms} hab` : null,
    property.bathrooms != null ? `${property.bathrooms} banos` : null,
    property.area ? `${property.area} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const location = [property.city, property.address].filter(Boolean).join(", ");

  // Build HTML email
  const html = buildPropertyEmailHtml({
    title: property.title,
    price,
    operation: operationLabels[property.operation] ?? property.operation,
    specs,
    location,
    description: property.description,
    coverUrl,
    publicUrl,
  });

  const from = getMailFrom();
  const subject = `${property.title}${price ? ` — ${price}` : ""}`;

  let sent = 0;
  let failed = 0;

  for (const contact of recipients) {
    try {
      await sendEmail({
        from,
        to: contact.email!,
        subject,
        html,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return { sent, failed, total: recipients.length };
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

function buildPropertyEmailHtml(data: {
  title: string;
  price: string | null;
  operation: string;
  specs: string;
  location: string;
  description: string | null;
  coverUrl: string | null;
  publicUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        ${data.coverUrl ? `<tr><td><img src="${data.coverUrl}" alt="${data.title}" width="600" style="display:block;width:100%;height:auto;object-fit:cover;max-height:340px"></td></tr>` : ""}
        <tr><td style="padding:28px 32px">
          <div style="display:inline-block;background:#0A2B1D;color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:12px">${data.operation}</div>
          <h1 style="margin:12px 0 4px;font-size:22px;color:#0A2B1D;line-height:1.3">${data.title}</h1>
          ${data.price ? `<p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#0A2B1D">${data.price}</p>` : ""}
          ${data.location ? `<p style="margin:0 0 8px;font-size:13px;color:#666">📍 ${data.location}</p>` : ""}
          <p style="margin:0 0 16px;font-size:13px;color:#888;letter-spacing:0.3px">${data.specs}</p>
          ${data.description ? `<p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6">${data.description.slice(0, 300)}${data.description.length > 300 ? "..." : ""}</p>` : ""}
          <a href="${data.publicUrl}" style="display:inline-block;background:#0A2B1D;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">Ver propiedad completa</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #eee">
          <p style="margin:0;font-size:11px;color:#aaa;text-align:center">Enviado desde Propi — CRM Inmobiliario</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
