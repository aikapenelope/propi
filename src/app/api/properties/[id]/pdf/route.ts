import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { properties, propertyImages } from "@/server/schema";
import { eq, and } from "drizzle-orm";
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

  // Get agent name from Clerk
  let agentName = "Agente";
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    agentName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Agente";
  } catch {
    // Fallback
  }

  // Build cover image URL (absolute for PDF rendering)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://propi.aikalabs.cc";
  const coverImage = property.images[0];
  const coverImageUrl = coverImage ? `${baseUrl}/api/images/${coverImage.key}` : null;
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
    console.error("Property sheet PDF error:", err);
    return NextResponse.json(
      { error: "Error generando la ficha PDF" },
      { status: 500 },
    );
  }
}
