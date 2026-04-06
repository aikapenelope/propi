"use server";

import { db } from "@/lib/db";
import { marketListings } from "@/server/schema";
import { sql, and, gte, ilike, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

/**
 * Search all market listings for a zone with deduplication.
 * Duplicates are detected by similar title + same price + same area.
 * Uses DISTINCT ON to keep only the most recent listing per group.
 */

const TWELVE_MONTHS = 365 * 24 * 60 * 60 * 1000;

export interface ZoneQuery {
  propertyType?: string;
  operation?: string;
  city?: string;
  neighborhood?: string;
  areaMin?: number;
  areaMax?: number;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
}

function buildConditions(query: ZoneQuery): SQL[] {
  const conditions: SQL[] = [];
  const cutoff = new Date(Date.now() - TWELVE_MONTHS);
  conditions.push(gte(marketListings.publishedAt, cutoff));

  if (query.propertyType) {
    conditions.push(ilike(marketListings.propertyType, `%${query.propertyType}%`));
  }
  if (query.operation) {
    conditions.push(ilike(marketListings.operation, `%${query.operation}%`));
  }
  if (query.neighborhood) {
    conditions.push(ilike(marketListings.neighborhood, `%${query.neighborhood}%`));
  } else if (query.city) {
    conditions.push(ilike(marketListings.city, `%${query.city}%`));
  }
  if (query.areaMin) {
    conditions.push(sql`CAST(${marketListings.areaM2} AS NUMERIC) >= ${query.areaMin}`);
  }
  if (query.areaMax) {
    conditions.push(sql`CAST(${marketListings.areaM2} AS NUMERIC) <= ${query.areaMax}`);
  }
  if (query.priceMin) {
    conditions.push(sql`CAST(${marketListings.price} AS NUMERIC) >= ${query.priceMin}`);
  }
  if (query.priceMax) {
    conditions.push(sql`CAST(${marketListings.price} AS NUMERIC) <= ${query.priceMax}`);
  }
  if (query.bedrooms) {
    conditions.push(sql`${marketListings.bedrooms} = ${query.bedrooms}`);
  }

  return conditions;
}

/**
 * Get all listings for a zone, deduplicated.
 * Dedup strategy: group by (normalized title prefix + price + area) and keep newest.
 */
export async function getZoneListings(query: ZoneQuery) {
  const conditions = buildConditions(query);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Use a subquery with ROW_NUMBER to deduplicate
  // Properties with same price + same area + similar title (first 40 chars) = duplicate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any = await db.execute(sql`
    SELECT DISTINCT ON (
      COALESCE(CAST(price AS NUMERIC), 0),
      COALESCE(CAST(area_m2 AS NUMERIC), 0),
      LEFT(LOWER(COALESCE(title, '')), 40)
    )
    id, external_id, title, price, currency, area_m2,
    bedrooms, bathrooms, parking, property_type, operation,
    city, state, neighborhood, permalink, thumbnail,
    seller_nickname, published_at, condition
    FROM market_listings
    ${where ? sql`WHERE ${where}` : sql``}
    ORDER BY
      COALESCE(CAST(price AS NUMERIC), 0),
      COALESCE(CAST(area_m2 AS NUMERIC), 0),
      LEFT(LOWER(COALESCE(title, '')), 40),
      published_at DESC NULLS LAST
  `);

  return results.rows as Array<{
    id: string;
    external_id: string;
    title: string | null;
    price: string | null;
    currency: string | null;
    area_m2: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: number | null;
    property_type: string | null;
    operation: string | null;
    city: string | null;
    state: string | null;
    neighborhood: string | null;
    permalink: string | null;
    thumbnail: string | null;
    seller_nickname: string | null;
    published_at: string | null;
    condition: string | null;
  }>;
}

/**
 * Get KPIs for the full zone (not limited to 20).
 */
export async function getZoneKPIs(query: ZoneQuery) {
  const conditions = buildConditions(query);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      total: count(),
      avgPrice: sql<number>`ROUND(AVG(CAST(${marketListings.price} AS NUMERIC)))`,
      medianPrice: sql<number>`ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CAST(${marketListings.price} AS NUMERIC)))`,
      minPrice: sql<number>`MIN(CAST(${marketListings.price} AS NUMERIC))`,
      maxPrice: sql<number>`MAX(CAST(${marketListings.price} AS NUMERIC))`,
      avgPriceM2: sql<number>`ROUND(AVG(CAST(${marketListings.price} AS NUMERIC) / NULLIF(CAST(${marketListings.areaM2} AS NUMERIC), 0)))`,
      avgArea: sql<number>`ROUND(AVG(CAST(${marketListings.areaM2} AS NUMERIC)))`,
    })
    .from(marketListings)
    .where(where);

  return stats;
}
