import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketListings, socialAccounts } from "@/server/schema";
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
 * Multi-tenant: iterates over all users with ML connected, syncs with each user's token.
 * market_listings is a shared public table (not scoped by userId).
 *
 * Protected by CRON_SECRET header.
 * Call: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/sync-market
 */
export async function GET(request: Request) {
  // Auth check - CRON_SECRET is required
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users with ML connected
  const mlAccounts = await db.query.socialAccounts.findMany({
    where: eq(socialAccounts.platform, "mercadolibre"),
  });

  if (mlAccounts.length === 0) {
    return NextResponse.json(
      { error: "No MercadoLibre accounts connected" },
      { status: 200 },
    );
  }

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const userResults: { userId: string; inserted: number; updated: number; error?: string }[] = [];

  // Sync for each user with ML connected
  for (const account of mlAccounts) {
    let token: string;
    try {
      token = await getMeliToken(account.userId);
    } catch (err) {
      userResults.push({
        userId: account.userId,
        inserted: 0,
        updated: 0,
        error: err instanceof Error ? err.message : "Token error",
      });
      continue;
    }

    const result = await syncForUser(token);
    totalInserted += result.inserted;
    totalUpdated += result.updated;
    totalSkipped += result.skipped;
    userResults.push({
      userId: account.userId,
      inserted: result.inserted,
      updated: result.updated,
    });
  }

  return NextResponse.json({
    success: true,
    users: userResults.length,
    inserted: totalInserted,
    updated: totalUpdated,
    skipped: totalSkipped,
    details: userResults,
    timestamp: new Date().toISOString(),
  });
}

/** Sync all categories for a single user's ML token */
async function syncForUser(token: string) {
  const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

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

        if (results.length === 0) break;
      } catch {
        break;
      }

      for (const item of results) {
        const attrs: Record<string, string> = {};
        for (const a of item.attributes || []) {
          if (a.value_name) attrs[a.id] = a.value_name;
        }

        const publishedAt = item.start_time
          ? new Date(item.start_time)
          : null;

        if (publishedAt && publishedAt < cutoff) {
          skipped++;
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
          await db
            .update(marketListings)
            .set({
              lastSeenAt: new Date(),
              price: listingData.price,
              thumbnail: listingData.thumbnail,
            })
            .where(eq(marketListings.externalId, item.id));
          updated++;
        } else {
          await db.insert(marketListings).values(listingData);
          inserted++;
        }
      }
    }
  }

  return { inserted, updated, skipped };
}
