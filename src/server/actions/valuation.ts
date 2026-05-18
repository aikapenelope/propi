"use server";

import { db } from "@/lib/db";
import { marketListings } from "@/server/schema";
import { sql, and, gte, ilike, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { sanitizeLike } from "@/lib/sanitize";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValuationInput {
  propertyType: string;
  operation: string;
  city: string;
  neighborhood?: string;
  areaM2?: number;
  bedrooms?: number;
  bathrooms?: number;
  /** Client's asking price — used to position within the market */
  askingPrice?: number;
}

export interface ValuationComparable {
  id: string;
  title: string | null;
  price: number;
  currency: string | null;
  areaM2: number | null;
  pricePerM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  city: string | null;
  neighborhood: string | null;
  condition: string | null;
  permalink: string | null;
  thumbnail: string | null;
  publishedAt: Date | null;
}

export interface ValuationResult {
  comparables: ValuationComparable[];
  stats: {
    total: number;
    avgPrice: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
    avgPricePerM2: number | null;
    avgArea: number | null;
  };
  /** Where the asking price sits relative to the market (percentile 0-100) */
  pricePosition: number | null;
  /** Suggested price range based on comparable data */
  suggestedRange: { min: number; max: number } | null;
}

// ---------------------------------------------------------------------------
// Property type and operation mappings (Propi -> MercadoLibre)
// ---------------------------------------------------------------------------

const TYPE_MAP: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  office: "Oficina",
  commercial: "Local",
  land: "Terreno",
  warehouse: "Galpon",
};

const OP_MAP: Record<string, string> = {
  sale: "Venta",
  rent: "Alquiler",
};

// ---------------------------------------------------------------------------
// Valuation query
// ---------------------------------------------------------------------------

/**
 * Query market_listings to find comparable properties for a valuation.
 *
 * Strategy:
 * 1. Match by type + operation + city (mandatory)
 * 2. Narrow by neighborhood if provided
 * 3. Narrow by area (+/- 30%) if provided
 * 4. Narrow by bedrooms if provided
 * 5. Only listings from the last 12 months
 * 6. Deduplicate by title prefix + price + area
 * 7. Calculate KPIs and price positioning
 */
export async function getValuation(input: ValuationInput): Promise<ValuationResult | null> {
  await requireUserId();

  const mlType = TYPE_MAP[input.propertyType] || input.propertyType;
  const mlOp = OP_MAP[input.operation] || input.operation;

  // Build conditions
  const conditions: SQL[] = [];
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  conditions.push(gte(marketListings.publishedAt, cutoff));
  conditions.push(ilike(marketListings.propertyType, `%${sanitizeLike(mlType)}%`));
  conditions.push(ilike(marketListings.operation, `%${sanitizeLike(mlOp)}%`));
  conditions.push(ilike(marketListings.city, `%${sanitizeLike(input.city)}%`));

  if (input.neighborhood) {
    conditions.push(ilike(marketListings.neighborhood, `%${sanitizeLike(input.neighborhood)}%`));
  }

  if (input.areaM2 && input.areaM2 > 0) {
    const areaMin = Math.round(input.areaM2 * 0.7);
    const areaMax = Math.round(input.areaM2 * 1.3);
    conditions.push(sql`CAST(${marketListings.areaM2} AS NUMERIC) >= ${areaMin}`);
    conditions.push(sql`CAST(${marketListings.areaM2} AS NUMERIC) <= ${areaMax}`);
  }

  if (input.bedrooms && input.bedrooms > 0) {
    conditions.push(sql`${marketListings.bedrooms} = ${input.bedrooms}`);
  }

  const where = and(...conditions);

  // Get KPIs first (full dataset, not limited)
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

  if (!stats || stats.total === 0) return null;

  // Get top 10 comparables (deduplicated, most recent first)
  const results = await db.execute<{
    id: string;
    title: string | null;
    price: string | null;
    currency: string | null;
    area_m2: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: number | null;
    city: string | null;
    neighborhood: string | null;
    condition: string | null;
    permalink: string | null;
    thumbnail: string | null;
    published_at: string | null;
  }>(sql`
    SELECT DISTINCT ON (
      COALESCE(CAST(price AS NUMERIC), 0),
      COALESCE(CAST(area_m2 AS NUMERIC), 0),
      LEFT(LOWER(COALESCE(title, '')), 40)
    )
    id, title, price, currency, area_m2,
    bedrooms, bathrooms, parking,
    city, neighborhood, condition,
    permalink, thumbnail, published_at
    FROM market_listings
    WHERE ${where}
    ORDER BY
      COALESCE(CAST(price AS NUMERIC), 0),
      COALESCE(CAST(area_m2 AS NUMERIC), 0),
      LEFT(LOWER(COALESCE(title, '')), 40),
      published_at DESC NULLS LAST
    LIMIT 10
  `);

  const comparables: ValuationComparable[] = Array.from(results).map((r) => {
    const price = parseFloat(r.price || "0");
    const area = parseFloat(r.area_m2 || "0");
    return {
      id: r.id,
      title: r.title,
      price,
      currency: r.currency,
      areaM2: area || null,
      pricePerM2: area > 0 ? Math.round(price / area) : null,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      parking: r.parking,
      city: r.city,
      neighborhood: r.neighborhood,
      condition: r.condition,
      permalink: r.permalink,
      thumbnail: r.thumbnail,
      publishedAt: r.published_at ? new Date(r.published_at) : null,
    };
  });

  // Calculate price position (what percentile is the asking price at)
  let pricePosition: number | null = null;
  if (input.askingPrice && input.askingPrice > 0 && stats.total > 0) {
    const [below] = await db
      .select({ cnt: count() })
      .from(marketListings)
      .where(
        and(
          where,
          sql`CAST(${marketListings.price} AS NUMERIC) <= ${input.askingPrice}`,
        ),
      );
    pricePosition = Math.round((below.cnt / stats.total) * 100);
  }

  // Suggested range: interquartile range (P25 to P75)
  const [quartiles] = await db
    .select({
      p25: sql<number>`ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY CAST(${marketListings.price} AS NUMERIC)))`,
      p75: sql<number>`ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY CAST(${marketListings.price} AS NUMERIC)))`,
    })
    .from(marketListings)
    .where(where);

  const suggestedRange =
    quartiles && quartiles.p25 && quartiles.p75
      ? { min: quartiles.p25, max: quartiles.p75 }
      : null;

  return {
    comparables,
    stats: {
      total: stats.total,
      avgPrice: stats.avgPrice,
      medianPrice: stats.medianPrice,
      minPrice: stats.minPrice,
      maxPrice: stats.maxPrice,
      avgPricePerM2: stats.avgPriceM2 || null,
      avgArea: stats.avgArea || null,
    },
    pricePosition,
    suggestedRange,
  };
}
