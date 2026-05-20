import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { properties, propertyImages } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { log } from "@/lib/logger";
import React from "react";

export const dynamic = "force-dynamic";

/**
 * Generate a property sheet PDF for download.
 *
 * GET /api/properties/[id]/pdf
 *
 * Returns a 1-page PDF with cover image, title, price, specs, description,
 * and agent name. Used by agents to share property details with clients.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await props.params;

  // Fetch property (verify ownership)
  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, id), eq(properties.userId, userId)),
    with: {
      images: { orderBy: [propertyImages.sortOrder], limit: 1 },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  // Get agent name and company branding
  let agentName = "Agente";
  let companyName: string | null = null;
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    agentName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Agente";
  } catch {
    // Fallback
  }
  try {
    const { getUserSettingsByUserId } = await import("@/server/actions/user-settings");
    const settings = await getUserSettingsByUserId(userId);
    companyName = settings.companyName ?? null;
  } catch {
    // Fallback
  }

  // Read cover image directly from MinIO as buffer (avoids self-HTTP fetch issues)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://propi.aikalabs.cc";
  const coverImage = property.images[0];
  let coverImageUrl: string | null = null;

  if (coverImage) {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { s3, MEDIA_BUCKET } = await import("@/lib/s3");
      const response = await s3.send(
        new GetObjectCommand({ Bucket: MEDIA_BUCKET, Key: coverImage.key }),
      );
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        const stream = response.Body as AsyncIterable<Uint8Array>;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const contentType = response.ContentType || "image/jpeg";
        coverImageUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
      }
    } catch {
      // Image unavailable — PDF will render without it
    }
  }

  const publicUrl = `${baseUrl}/p/${property.id}`;

  try {
    const { PropertySheetPDF } = await import("@/lib/property-sheet-pdf");
    const { renderToBuffer } = await import("@react-pdf/renderer");

    const element = React.createElement(PropertySheetPDF, {
      data: {
        title: property.title,
        description: property.description,
        type: property.type,
        operation: property.operation,
        price: property.price,
        currency: property.currency || "USD",
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        address: property.address,
        city: property.city,
        state: property.state,
        coverImageUrl,
        agentName,
        companyName,
        publicUrl,
      },
    });

    const buffer = await renderToBuffer(
      element as Parameters<typeof renderToBuffer>[0],
    );

    const safeTitle = property.title.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 50).trim();
    const filename = `ficha-${safeTitle || "propiedad"}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    log.http.error({ error: err instanceof Error ? err.message : String(err) }, "property sheet PDF generation failed");
    return NextResponse.json(
      { error: "Error generando la ficha PDF" },
      { status: 500 },
    );
  }
}
