"use server";

import { db } from "@/lib/db";
import { properties, marketListings } from "@/server/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Comparable {
  id: string;
  title: string | null;
  price: number;
  areaM2: number | null;
  pricePerM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string | null;
  neighborhood: string | null;
  permalink: string | null;
  lastSeenAt: Date | null;
}

export interface ComparablesResult {
  comparables: Comparable[];
  stats: {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    avgPricePerM2: number | null;
    count: number;
  };
}

// ---------------------------------------------------------------------------
// Get comparables for a property
// ---------------------------------------------------------------------------

/**
 * Find 5 similar properties from market_listings based on type, operation,
 * city, and price range. Used to justify pricing in property valuations.
 */
export async function getComparables(propertyId: string): Promise<ComparablesResult | null> {
  const userId = await requireUserId();

  // Get the property to compare against
  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, propertyId), eq(properties.userId, userId)),
    columns: {
      type: true,
      operation: true,
      city: true,
      price: true,
      area: true,
    },
  });

  if (!property || !property.city) return null;

  const price = parseFloat(property.price || "0");
  if (price === 0) return null;

  // Search range: +/- 40% of the property price
  const minPrice = Math.round(price * 0.6);
  const maxPrice = Math.round(price * 1.4);

  // Map Propi property types to market_listings property_type values
  const typeMap: Record<string, string> = {
    apartment: "Apartamento",
    house: "Casa",
    office: "Oficina",
    commercial: "Local",
    land: "Terreno",
    warehouse: "Galpon",
  };

  const opMap: Record<string, string> = {
    sale: "Venta",
    rent: "Alquiler",
    sale_rent: "Venta",
    sell: "Venta",
    lease: "Alquiler",
  };

  const mlType = typeMap[property.type] || property.type;
  const mlOp = opMap[property.operation] || "Venta";

  const results = await db
    .select({
      id: marketListings.id,
      title: marketListings.title,
      price: marketListings.price,
      areaM2: marketListings.areaM2,
      bedrooms: marketListings.bedrooms,
      bathrooms: marketListings.bathrooms,
      city: marketListings.city,
      neighborhood: marketListings.neighborhood,
      permalink: marketListings.permalink,
      lastSeenAt: marketListings.lastSeenAt,
    })
    .from(marketListings)
    .where(
      and(
        eq(marketListings.propertyType, mlType),
        eq(marketListings.operation, mlOp),
        sql`LOWER(${marketListings.city}) = LOWER(${property.city})`,
        gte(marketListings.price, String(minPrice)),
        lte(marketListings.price, String(maxPrice)),
      ),
    )
    .orderBy(desc(marketListings.lastSeenAt))
    .limit(5);

  if (results.length === 0) return null;

  const comparables: Comparable[] = results.map((r) => {
    const p = parseFloat(r.price || "0");
    const area = parseFloat(r.areaM2 || "0");
    return {
      id: r.id,
      title: r.title,
      price: p,
      areaM2: area || null,
      pricePerM2: area > 0 ? Math.round(p / area) : null,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      city: r.city,
      neighborhood: r.neighborhood,
      permalink: r.permalink,
      lastSeenAt: r.lastSeenAt,
    };
  });

  const prices = comparables.map((c) => c.price);
  const pricesPerM2 = comparables
    .map((c) => c.pricePerM2)
    .filter((p): p is number => p !== null);

  return {
    comparables,
    stats: {
      avgPrice: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPricePerM2:
        pricesPerM2.length > 0
          ? Math.round(pricesPerM2.reduce((s, p) => s + p, 0) / pricesPerM2.length)
          : null,
      count: comparables.length,
    },
  };
}
