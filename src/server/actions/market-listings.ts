"use server";

import { db } from "@/lib/db";
import { marketListings } from "@/server/schema";
import { sql, and, gte, lte, ilike, eq, desc, count } from "drizzle-orm";
import type { ParsedQuery } from "@/lib/market-parser";
import { requireUserId } from "@/lib/auth-helper";
import { sanitizeLike } from "@/lib/sanitize";

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Search market_listings with parsed query parameters */
export async function searchMarketListings(
  query: ParsedQuery,
  limit = 20,
) {
  await requireUserId();
  const conditions = [];

  if (query.propertyType) {
    conditions.push(ilike(marketListings.propertyType, `%${sanitizeLike(query.propertyType)}%`));
  }
  if (query.operation) {
    conditions.push(ilike(marketListings.operation, `%${sanitizeLike(query.operation)}%`));
  }
  if (query.neighborhood) {
    conditions.push(ilike(marketListings.neighborhood, `%${sanitizeLike(query.neighborhood)}%`));
  } else if (query.city) {
    conditions.push(ilike(marketListings.city, `%${sanitizeLike(query.city)}%`));
  }
  if (query.areaMin) {
    conditions.push(gte(sql`CAST(${marketListings.areaM2} AS NUMERIC)`, query.areaMin));
  }
  if (query.areaMax) {
    conditions.push(lte(sql`CAST(${marketListings.areaM2} AS NUMERIC)`, query.areaMax));
  }
  if (query.priceMin) {
    conditions.push(gte(sql`CAST(${marketListings.price} AS NUMERIC)`, query.priceMin));
  }
  if (query.priceMax) {
    conditions.push(lte(sql`CAST(${marketListings.price} AS NUMERIC)`, query.priceMax));
  }
  if (query.bedrooms) {
    conditions.push(eq(marketListings.bedrooms, query.bedrooms));
  }
  if (query.bathrooms) {
    conditions.push(eq(marketListings.bathrooms, query.bathrooms));
  }

  // Only listings from last 12 months
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  conditions.push(gte(marketListings.publishedAt, cutoff));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select()
    .from(marketListings)
    .where(where)
    .orderBy(desc(marketListings.lastSeenAt))
    .limit(limit);

  return results;
}

// ---------------------------------------------------------------------------
// KPIs (all SQL, no LLM)
// ---------------------------------------------------------------------------

/** Get KPIs for a search query */
export async function getMarketKPIs(query: ParsedQuery) {
  await requireUserId();
  const conditions = [];

  if (query.propertyType) {
    conditions.push(ilike(marketListings.propertyType, `%${sanitizeLike(query.propertyType)}%`));
  }
  if (query.operation) {
    conditions.push(ilike(marketListings.operation, `%${sanitizeLike(query.operation)}%`));
  }
  if (query.neighborhood) {
    conditions.push(ilike(marketListings.neighborhood, `%${sanitizeLike(query.neighborhood)}%`));
  } else if (query.city) {
    conditions.push(ilike(marketListings.city, `%${sanitizeLike(query.city)}%`));
  }

  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  conditions.push(gte(marketListings.publishedAt, cutoff));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      total: count(),
      avgPrice: sql<number>`AVG(CAST(${marketListings.price} AS NUMERIC))`,
      minPrice: sql<number>`MIN(CAST(${marketListings.price} AS NUMERIC))`,
      maxPrice: sql<number>`MAX(CAST(${marketListings.price} AS NUMERIC))`,
      medianPrice: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CAST(${marketListings.price} AS NUMERIC))`,
      avgPriceM2: sql<number>`AVG(CAST(${marketListings.price} AS NUMERIC) / NULLIF(CAST(${marketListings.areaM2} AS NUMERIC), 0))`,
    })
    .from(marketListings)
    .where(where);

  return {
    total: stats?.total ?? 0,
    avgPrice: stats?.avgPrice ? Math.round(stats.avgPrice) : null,
    minPrice: stats?.minPrice ? Math.round(stats.minPrice) : null,
    maxPrice: stats?.maxPrice ? Math.round(stats.maxPrice) : null,
    medianPrice: stats?.medianPrice ? Math.round(stats.medianPrice) : null,
    avgPriceM2: stats?.avgPriceM2 ? Math.round(stats.avgPriceM2) : null,
  };
}

// ---------------------------------------------------------------------------
// Global stats (for Market Insights page)
// ---------------------------------------------------------------------------

/** Total listings in DB */

/** Listings by property type */

/** Listings by operation (sale vs rent) */

/** Top 10 neighborhoods by avg price/m2 */

/** New listings this week */
