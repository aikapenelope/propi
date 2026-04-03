"use server";

import { db } from "@/lib/db";
import { marketListings } from "@/server/schema";
import { sql, and, gte, ilike, count, desc } from "drizzle-orm";

/**
 * Market intelligence KPIs by city.
 * All data comes from market_listings (MercadoLibre sync).
 * KPIs are SQL-only, no AI involved.
 */

const TWELVE_MONTHS = 365 * 24 * 60 * 60 * 1000;

function cityFilter(city: string) {
  return and(
    ilike(marketListings.city, `%${city}%`),
    gte(marketListings.publishedAt, new Date(Date.now() - TWELVE_MONTHS)),
  );
}

// ---------------------------------------------------------------------------
// 1. Overview KPIs
// ---------------------------------------------------------------------------

export async function getCityOverview(city: string) {
  const where = cityFilter(city);

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

// ---------------------------------------------------------------------------
// 2. Price per m2 by neighborhood (top 10)
// ---------------------------------------------------------------------------

export async function getPricePerM2ByNeighborhood(city: string) {
  const where = cityFilter(city);

  return db
    .select({
      neighborhood: marketListings.neighborhood,
      avgPriceM2: sql<number>`ROUND(AVG(CAST(${marketListings.price} AS NUMERIC) / NULLIF(CAST(${marketListings.areaM2} AS NUMERIC), 0)))`,
      count: count(),
    })
    .from(marketListings)
    .where(
      and(
        where,
        sql`${marketListings.neighborhood} IS NOT NULL`,
        sql`${marketListings.neighborhood} != ''`,
        sql`CAST(${marketListings.areaM2} AS NUMERIC) > 0`,
      ),
    )
    .groupBy(marketListings.neighborhood)
    .having(sql`count(*) >= 3`)
    .orderBy(desc(sql`AVG(CAST(${marketListings.price} AS NUMERIC) / NULLIF(CAST(${marketListings.areaM2} AS NUMERIC), 0))`))
    .limit(10);
}

// ---------------------------------------------------------------------------
// 3. Price trend by month (last 12 months)
// ---------------------------------------------------------------------------

export async function getPriceTrendByMonth(city: string) {
  const where = cityFilter(city);

  return db
    .select({
      month: sql<string>`TO_CHAR(${marketListings.publishedAt}, 'YYYY-MM')`,
      avgPrice: sql<number>`ROUND(AVG(CAST(${marketListings.price} AS NUMERIC)))`,
      count: count(),
    })
    .from(marketListings)
    .where(where)
    .groupBy(sql`TO_CHAR(${marketListings.publishedAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${marketListings.publishedAt}, 'YYYY-MM')`);
}

// ---------------------------------------------------------------------------
// 4. Inventory by property type
// ---------------------------------------------------------------------------

export async function getInventoryByType(city: string) {
  const where = cityFilter(city);

  return db
    .select({
      type: marketListings.propertyType,
      count: count(),
      avgPrice: sql<number>`ROUND(AVG(CAST(${marketListings.price} AS NUMERIC)))`,
    })
    .from(marketListings)
    .where(where)
    .groupBy(marketListings.propertyType)
    .orderBy(desc(count()));
}

// ---------------------------------------------------------------------------
// 5. Price distribution (histogram buckets)
// ---------------------------------------------------------------------------

export async function getPriceDistribution(city: string) {
  const where = cityFilter(city);

  return db
    .select({
      bucket: sql<string>`CASE
        WHEN CAST(${marketListings.price} AS NUMERIC) < 30000 THEN '<$30K'
        WHEN CAST(${marketListings.price} AS NUMERIC) < 60000 THEN '$30-60K'
        WHEN CAST(${marketListings.price} AS NUMERIC) < 100000 THEN '$60-100K'
        WHEN CAST(${marketListings.price} AS NUMERIC) < 200000 THEN '$100-200K'
        WHEN CAST(${marketListings.price} AS NUMERIC) < 500000 THEN '$200-500K'
        ELSE '>$500K'
      END`,
      count: count(),
    })
    .from(marketListings)
    .where(and(where, sql`CAST(${marketListings.price} AS NUMERIC) > 0`))
    .groupBy(sql`CASE
      WHEN CAST(${marketListings.price} AS NUMERIC) < 30000 THEN '<$30K'
      WHEN CAST(${marketListings.price} AS NUMERIC) < 60000 THEN '$30-60K'
      WHEN CAST(${marketListings.price} AS NUMERIC) < 100000 THEN '$60-100K'
      WHEN CAST(${marketListings.price} AS NUMERIC) < 200000 THEN '$100-200K'
      WHEN CAST(${marketListings.price} AS NUMERIC) < 500000 THEN '$200-500K'
      ELSE '>$500K'
    END`);
}

// ---------------------------------------------------------------------------
// 6. New listings per week (last 8 weeks)
// ---------------------------------------------------------------------------

export async function getWeeklyNewListings(city: string) {
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

  return db
    .select({
      week: sql<string>`TO_CHAR(${marketListings.publishedAt}, 'IYYY-IW')`,
      count: count(),
    })
    .from(marketListings)
    .where(
      and(
        ilike(marketListings.city, `%${city}%`),
        gte(marketListings.publishedAt, eightWeeksAgo),
      ),
    )
    .groupBy(sql`TO_CHAR(${marketListings.publishedAt}, 'IYYY-IW')`)
    .orderBy(sql`TO_CHAR(${marketListings.publishedAt}, 'IYYY-IW')`);
}

// ---------------------------------------------------------------------------
// 7. Top sellers (competition)
// ---------------------------------------------------------------------------

export async function getTopSellers(city: string) {
  const where = cityFilter(city);

  return db
    .select({
      seller: marketListings.sellerNickname,
      count: count(),
    })
    .from(marketListings)
    .where(
      and(
        where,
        sql`${marketListings.sellerNickname} IS NOT NULL`,
        sql`${marketListings.sellerNickname} != ''`,
      ),
    )
    .groupBy(marketListings.sellerNickname)
    .orderBy(desc(count()))
    .limit(10);
}

// ---------------------------------------------------------------------------
// 8. Condition breakdown (nuevo vs usado)
// ---------------------------------------------------------------------------

export async function getConditionBreakdown(city: string) {
  const where = cityFilter(city);

  return db
    .select({
      condition: marketListings.condition,
      count: count(),
      avgPrice: sql<number>`ROUND(AVG(CAST(${marketListings.price} AS NUMERIC)))`,
    })
    .from(marketListings)
    .where(
      and(
        where,
        sql`${marketListings.condition} IS NOT NULL`,
        sql`${marketListings.condition} != ''`,
      ),
    )
    .groupBy(marketListings.condition)
    .orderBy(desc(count()));
}
