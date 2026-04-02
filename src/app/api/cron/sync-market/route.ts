import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketListings } from "@/server/schema";
import { getMeliToken, type MeliSearchResult } from "@/lib/mercadolibre";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Categories to sync daily */
const CATEGORIES = [
  { id: "MLV1472", type: "Apartamento", operation: "Venta" },
  { id: "MLV1466", type: "Casa", operation: "Venta" },
  { id: "MLV1473", type: "Oficina", operation: "Venta" },
  { id: "MLV1474", type: "Local", operation: "Venta" },
  { id: "MLV1493", type: "Apartamento", operation: "Alquiler" },
  { id: "MLV1492", type: "Casa", operation: "Alquiler" },
];

const MELI_API = "https://api.mercadolibre.com";
const MAX_PAGES = 20; // 20 pages x 50 = 1000 per category
const PAGE_SIZE = 50;
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Daily cron job to sync MercadoLibre listings into market_listings.
 * Protected by CRON_SECRET header.
 * Call: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/sync-market
 */
export async function GET(request: Request) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let token: string;
  try {
    token = await getMeliToken();
  } catch {
    return NextResponse.json(
      { error: "MercadoLibre not connected" },
      { status: 502 },
    );
  }

  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS);
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const category of CATEGORIES) {
    for (let page = 0; page < MAX_PAGES; page++) {
      const offset = page * PAGE_SIZE;
      const url =
        `${MELI_API}/sites/MLV/search` +
        `?category=${category.id}` +
        `&sort=relevance` +
        `&limit=${PAGE_SIZE}` +
        `&offset=${offset}`;

      let results: MeliSearchResult[];
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 429) {
          // Rate limited, wait and retry
          const retryAfter = parseInt(
            res.headers.get("retry-after") || "5",
            10,
          );
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          page--; // Retry same page
          continue;
        }

        if (!res.ok) break;

        const data = await res.json();
        results = data.results || [];

        // No more results
        if (results.length === 0) break;
      } catch {
        break;
      }

      for (const item of results) {
        // Extract attributes
        const attrs: Record<string, string> = {};
        for (const a of item.attributes || []) {
          if (a.value_name) attrs[a.id] = a.value_name;
        }

        // Parse published date
        const publishedAt = item.start_time
          ? new Date(item.start_time)
          : null;

        // Skip listings older than 12 months
        if (publishedAt && publishedAt < cutoff) {
          totalSkipped++;
          continue;
        }

        const listingData = {
          externalId: item.id,
          source: "mercadolibre" as const,
          siteId: "MLV",
          title: item.title,
          price: item.price ? String(item.price) : null,
          currency: item.currency_id,
          areaM2: attrs.TOTAL_AREA
            ? String(parseFloat(attrs.TOTAL_AREA.replace(/[^\d.]/g, "")) || 0)
            : null,
          bedrooms: parseInt(attrs.BEDROOMS) || null,
          bathrooms: parseInt(attrs.FULL_BATHROOMS) || null,
          parking: parseInt(attrs.PARKING_LOTS) || null,
          propertyType: attrs.PROPERTY_TYPE || category.type,
          operation: attrs.OPERATION || category.operation,
          city: item.address?.city_name || null,
          state: item.address?.state_name || null,
          neighborhood: item.address?.neighborhood_name || null,
          latitude: item.location?.latitude
            ? String(item.location.latitude)
            : null,
          longitude: item.location?.longitude
            ? String(item.location.longitude)
            : null,
          condition: attrs.ITEM_CONDITION || null,
          permalink: item.permalink,
          thumbnail: item.secure_thumbnail || item.thumbnail,
          sellerNickname: item.seller?.nickname || null,
          publishedAt,
          lastSeenAt: new Date(),
          attributes: attrs as Record<string, unknown>,
        };

        // Upsert: insert or update
        const existing = await db.query.marketListings.findFirst({
          where: eq(marketListings.externalId, item.id),
          columns: { id: true, price: true },
        });

        if (existing) {
          // Update last_seen_at and price if changed
          await db
            .update(marketListings)
            .set({
              lastSeenAt: new Date(),
              price: listingData.price,
              thumbnail: listingData.thumbnail,
            })
            .where(eq(marketListings.externalId, item.id));
          totalUpdated++;
        } else {
          await db.insert(marketListings).values(listingData);
          totalInserted++;
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    inserted: totalInserted,
    updated: totalUpdated,
    skipped: totalSkipped,
    timestamp: new Date().toISOString(),
  });
}
