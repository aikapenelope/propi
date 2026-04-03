/**
 * BullMQ worker for background jobs.
 * Runs as a SEPARATE process from Next.js (via Dockerfile.worker or `npx tsx`).
 *
 * Jobs:
 * - market-sync: Sync MercadoLibre listings for a specific user
 *
 * Usage:
 *   npx tsx src/workers/market-sync-worker.ts
 *
 * Required env vars: REDIS_URL, DATABASE_URL, ML_APP_ID, ML_SECRET_KEY
 */

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../server/schema";

// ---------------------------------------------------------------------------
// Direct DB connection (not through Next.js, this is a standalone process)
// ---------------------------------------------------------------------------

const db = drizzle(
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    idle_timeout: 20,
  }),
  { schema },
);

// ---------------------------------------------------------------------------
// ML sync logic (extracted from the cron route)
// ---------------------------------------------------------------------------

const MELI_API = "https://api.mercadolibre.com";
const CATEGORIES = [
  { id: "MLV1472", type: "Apartamento", operation: "Venta" },
  { id: "MLV1466", type: "Casa", operation: "Venta" },
  { id: "MLV1473", type: "Oficina", operation: "Venta" },
  { id: "MLV1474", type: "Local", operation: "Venta" },
  { id: "MLV1493", type: "Apartamento", operation: "Alquiler" },
  { id: "MLV1492", type: "Casa", operation: "Alquiler" },
];
const MAX_PAGES = 20;
const PAGE_SIZE = 50;
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

interface MeliResult {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  permalink: string;
  thumbnail: string;
  secure_thumbnail?: string;
  start_time?: string;
  address?: { city_name?: string; state_name?: string; neighborhood_name?: string };
  location?: { latitude?: number; longitude?: number };
  seller?: { nickname?: string };
  attributes?: { id: string; value_name?: string }[];
}

async function syncCategory(
  token: string,
  category: { id: string; type: string; operation: string },
  cutoff: Date,
): Promise<{ inserted: number; updated: number; skipped: number }> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const url =
      `${MELI_API}/sites/MLV/search?category=${category.id}&sort=relevance&limit=${PAGE_SIZE}&offset=${offset}`;

    let results: MeliResult[];
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "5", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        page--;
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

      const publishedAt = item.start_time ? new Date(item.start_time) : null;
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
        latitude: item.location?.latitude ? String(item.location.latitude) : null,
        longitude: item.location?.longitude ? String(item.location.longitude) : null,
        condition: attrs.ITEM_CONDITION || null,
        permalink: item.permalink,
        thumbnail: item.secure_thumbnail || item.thumbnail,
        sellerNickname: item.seller?.nickname || null,
        publishedAt,
        lastSeenAt: new Date(),
        attributes: attrs as Record<string, unknown>,
      };

      const existing = await db.query.marketListings.findFirst({
        where: eq(schema.marketListings.externalId, item.id),
        columns: { id: true },
      });

      if (existing) {
        await db
          .update(schema.marketListings)
          .set({ lastSeenAt: new Date(), price: listingData.price, thumbnail: listingData.thumbnail })
          .where(eq(schema.marketListings.externalId, item.id));
        updated++;
      } else {
        await db.insert(schema.marketListings).values(listingData);
        inserted++;
      }
    }
  }

  return { inserted, updated, skipped };
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL || "redis://:password@10.0.1.20:6379/3";

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker(
  "market-sync",
  async (job) => {
    const { userId, token } = job.data as { userId: string; token: string };
    console.log(`[market-sync] Processing job ${job.id} for user ${userId}`);

    const cutoff = new Date(Date.now() - TWELVE_MONTHS_MS);
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const category of CATEGORIES) {
      const result = await syncCategory(token, category, cutoff);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;

      await job.updateProgress(
        Math.round(((CATEGORIES.indexOf(category) + 1) / CATEGORIES.length) * 100),
      );
    }

    console.log(
      `[market-sync] Done for ${userId}: +${totalInserted} ~${totalUpdated} -${totalSkipped}`,
    );

    return { inserted: totalInserted, updated: totalUpdated, skipped: totalSkipped };
  },
  {
    connection,
    concurrency: 2, // Process 2 users in parallel max
    limiter: {
      max: 10,
      duration: 60_000, // Max 10 jobs per minute (rate limit protection)
    },
  },
);

worker.on("completed", (job) => {
  console.log(`[market-sync] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[market-sync] Job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
async function shutdown() {
  console.log("[market-sync] Shutting down...");
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[market-sync] Worker started, waiting for jobs...");
