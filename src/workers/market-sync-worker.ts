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
        console.log(`[market-sync] Rate limited, waiting ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        page--;
        continue;
      }

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`[market-sync] API error ${res.status} for ${category.id} page ${page}: ${errBody}`);
        break;
      }
      const data = await res.json();
      results = data.results || [];
      if (results.length === 0) break;

      // Log progress on first page of each category
      if (page === 0) {
        console.log(`[market-sync] ${category.id} (${category.type}/${category.operation}): ${data.paging?.total ?? "?"} total listings`);
      }
    } catch (err) {
      console.error(`[market-sync] Fetch error for ${category.id} page ${page}:`, err instanceof Error ? err.message : err);
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

/** Refresh ML service token using client credentials */
async function refreshServiceToken(refreshToken: string) {
  const res = await fetch(`${MELI_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ML_APP_ID || "",
      client_secret: process.env.ML_SECRET_KEY || "",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`ML token refresh failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    userId: data.user_id as number,
  };
}

/** Send email alert when ML token dies. Uses Resend if configured. */
async function sendTokenDeathAlert(errorMessage: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL || process.env.MAIL_FROM;
  if (!apiKey || !alertEmail) return;

  const from = process.env.MAIL_FROM || "Propi <noreply@propi.aikalabs.cc>";
  const reauthorizeUrl =
    "https://auth.mercadolibre.cl/authorization?" +
    `response_type=code&client_id=${process.env.ML_APP_ID}` +
    "&redirect_uri=https://propi.aikalabs.cc/api/auth/mercadolibre/callback";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [alertEmail.replace(/.*<(.+)>/, "$1")],
      subject: "[Propi] MercadoLibre token muerto — re-autorizar",
      html:
        `<h2>El token de MercadoLibre expiro o fue revocado</h2>` +
        `<p><strong>Error:</strong> ${errorMessage}</p>` +
        `<p>El sync de propiedades esta detenido hasta que re-autorices.</p>` +
        `<p><a href="${reauthorizeUrl}">Click aqui para re-autorizar</a></p>` +
        `<p>Despues de autorizar, el proximo cron sincronizara automaticamente.</p>`,
    }),
  });
}

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker(
  "market-sync",
  async (job) => {
    console.log(`[market-sync] Processing job ${job.id}`);

    // Use platform-level service token (not tied to any user)
    const credential = await db.query.serviceCredentials.findFirst({
      where: eq(schema.serviceCredentials.service, "mercadolibre"),
    });

    if (!credential) {
      throw new Error(
        "No MercadoLibre service credential configured. Run the OAuth flow and seed service_credentials.",
      );
    }

    // Check token expiry and refresh if needed
    let token = credential.accessToken;
    const expiresAt = credential.tokenExpiresAt ?? new Date(0);
    const now = new Date();

    console.log(`[market-sync] Token expires: ${expiresAt.toISOString()}, now: ${now.toISOString()}, expired: ${expiresAt < now}`);
    console.log(`[market-sync] Has refresh token: ${!!credential.refreshToken}`);

    if (expiresAt < now) {
      if (!credential.refreshToken) {
        // No refresh token — try using the token anyway (ML sometimes accepts slightly expired tokens)
        console.warn("[market-sync] WARNING: Token appears expired and no refresh token available. Attempting anyway...");
      } else {
        console.log("[market-sync] Token expired, refreshing...");
        try {
          const refreshed = await refreshServiceToken(credential.refreshToken);
          token = refreshed.accessToken;

          // Update stored credentials
          await db
            .update(schema.serviceCredentials)
            .set({
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenExpiresAt: refreshed.expiresAt,
              metadata: { userId: refreshed.userId },
            })
            .where(eq(schema.serviceCredentials.service, "mercadolibre"));

          console.log(`[market-sync] Token refreshed, new expiry: ${refreshed.expiresAt.toISOString()}`);
        } catch (err) {
          console.error("[market-sync] Token refresh FAILED:", err instanceof Error ? err.message : err);
          throw new Error(`Token refresh failed: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    }

    // Test token with a single request before full sync
    console.log(`[market-sync] Testing token (first 25 chars): ${token.substring(0, 25)}...`);
    const testRes = await fetch(`${MELI_API}/sites/MLV/search?category=MLV1472&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!testRes.ok) {
      const errBody = await testRes.text().catch(() => "");
      throw new Error(`Token validation failed: ${testRes.status} ${errBody}`);
    }
    const testData = await testRes.json();
    console.log(`[market-sync] Token valid. MLV1472 has ${testData.paging?.total ?? 0} listings.`);

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
      `[market-sync] Done: +${totalInserted} ~${totalUpdated} -${totalSkipped}`,
    );

    return { inserted: totalInserted, updated: totalUpdated, skipped: totalSkipped };
  },
  {
    connection,
    concurrency: 1, // Single sync at a time (one service token)
    limiter: {
      max: 10,
      duration: 60_000,
    },
  },
);

worker.on("completed", (job) => {
  console.log(`[market-sync] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[market-sync] Job ${job?.id} failed:`, err.message);

  const isTokenDead =
    err.message.includes("403") ||
    err.message.includes("401") ||
    err.message.includes("Token refresh failed") ||
    err.message.includes("Token validation failed") ||
    err.message.includes("No MercadoLibre service credential");

  if (isTokenDead) {
    console.error(
      "[market-sync] TOKEN DEAD — Re-authorize at: https://auth.mercadolibre.cl/authorization?" +
      `response_type=code&client_id=${process.env.ML_APP_ID}` +
      "&redirect_uri=https://propi.aikalabs.cc/api/auth/mercadolibre/callback",
    );
    sendTokenDeathAlert(err.message).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// Email Campaign Worker
// ---------------------------------------------------------------------------

interface EmailJobData {
  campaignId: string;
  userId: string;
  resendApiKey?: string;
  recipients: { id: string; email: string }[];
  subject: string;
  htmlBody: string;
}

/** Minimal Resend client for the worker (no Next.js imports). */
async function workerSendEmail(to: string, subject: string, html: string, from: string, apiKey?: string) {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (!key) throw new Error("No Resend API key available (user or global)");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

const emailWorker = new Worker(
  "email-campaign",
  async (job) => {
    const data = job.data as EmailJobData;
    console.log(
      `[email-campaign] Processing campaign ${data.campaignId}: ${data.recipients.length} recipients`,
    );

    const from = process.env.MAIL_FROM || "Propi <noreply@propi.aikalabs.cc>";
    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of data.recipients) {
      try {
        await workerSendEmail(recipient.email, data.subject, data.htmlBody, from, data.resendApiKey);

        await db
          .insert(schema.campaignRecipients)
          .values({
            campaignId: data.campaignId,
            contactId: recipient.id,
            status: "delivered",
            sentAt: new Date(),
          });

        sentCount++;
      } catch (err) {
        console.error(`[email-campaign] Failed for ${recipient.email}:`, err);

        await db
          .insert(schema.campaignRecipients)
          .values({
            campaignId: data.campaignId,
            contactId: recipient.id,
            status: "failed",
          });

        failedCount++;
      }

      await job.updateProgress(
        Math.round(((sentCount + failedCount) / data.recipients.length) * 100),
      );
    }

    // Update campaign final status
    await db
      .update(schema.emailCampaigns)
      .set({
        status: failedCount === data.recipients.length ? "failed" : "sent",
        sentCount,
        failedCount,
        sentAt: new Date(),
      })
      .where(eq(schema.emailCampaigns.id, data.campaignId));

    console.log(
      `[email-campaign] Done: ${sentCount} sent, ${failedCount} failed`,
    );

    return { sentCount, failedCount };
  },
  {
    connection,
    concurrency: 1, // Send one campaign at a time to respect Resend rate limits
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[email-campaign] Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[email-campaign] Job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown() {
  console.log("[workers] Shutting down...");
  await Promise.all([worker.close(), emailWorker.close()]);
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[workers] Started: market-sync + email-campaign");
