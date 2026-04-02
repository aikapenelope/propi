"use server";

import { db } from "@/lib/db";
import { marketAnalyses, marketSnapshots } from "@/server/schema";
import { eq, desc } from "drizzle-orm";
import type { CleanedListing } from "@/lib/mercadolibre";
import type { AnalysisResult } from "@/lib/groq";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get all analyses for a property, newest first */
export async function getAnalyses(propertyId: string) {
  return db.query.marketAnalyses.findMany({
    where: eq(marketAnalyses.propertyId, propertyId),
    orderBy: [desc(marketAnalyses.createdAt)],
  });
}

/** Get a single analysis with its snapshots */
export async function getAnalysis(analysisId: string) {
  return db.query.marketAnalyses.findFirst({
    where: eq(marketAnalyses.id, analysisId),
    with: { snapshots: true },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Save MercadoLibre listings as snapshots, return the analysis ID */
export async function saveSnapshots(
  propertyId: string,
  query: string,
  siteId: string,
  listings: CleanedListing[],
): Promise<string> {
  // Create the analysis record first (without Groq results yet)
  const [analysis] = await db
    .insert(marketAnalyses)
    .values({
      propertyId,
      query,
      siteId,
      source: "mercadolibre",
      totalAnalyzed: listings.length,
    })
    .returning({ id: marketAnalyses.id });

  // Insert all snapshots
  if (listings.length > 0) {
    await db.insert(marketSnapshots).values(
      listings.map((listing, index) => ({
        analysisId: analysis.id,
        externalId: listing.id,
        title: listing.title,
        price: listing.price ? String(listing.price) : null,
        currency: listing.currency,
        areaM2: listing.area ? String(listing.area) : null,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        parking: listing.parking,
        city: listing.city,
        neighborhood: listing.neighborhood,
        permalink: listing.permalink,
        thumbnail: listing.thumbnail,
        listingIndex: index,
      })),
    );
  }

  return analysis.id;
}

/** Update an analysis with Groq results */
export async function saveAnalysisResults(
  analysisId: string,
  result: AnalysisResult,
) {
  await db
    .update(marketAnalyses)
    .set({
      avgPriceM2: result.avg_price_m2 ? String(result.avg_price_m2) : null,
      priceRange: result.price_range,
      saleVsRent: result.sale_vs_rent,
      userPosition: result.user_position,
      suggestedPrice: result.suggested_price
        ? String(result.suggested_price)
        : null,
      suggestedPriceRange: result.suggested_price_range,
      confidence: result.confidence,
      summary: result.summary,
      insights: result.insights,
      similarIndices: result.similar_indices,
      rawGroqResponse: result as unknown as Record<string, unknown>,
    })
    .where(eq(marketAnalyses.id, analysisId));
}
