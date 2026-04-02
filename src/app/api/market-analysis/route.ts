import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import {
  searchMeliProperties,
  cleanListings,
} from "@/lib/mercadolibre";
import {
  MARKET_ANALYSIS_SYSTEM_PROMPT,
  buildUserPrompt,
  parseAnalysisResponse,
} from "@/lib/groq";
import { getProperty } from "@/server/actions/properties";
import {
  saveSnapshots,
  saveAnalysisResults,
} from "@/server/actions/market-analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { propertyId } = await req.json();

  if (!propertyId) {
    return Response.json({ error: "propertyId required" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  // 1. Get user's property
  const property = await getProperty(propertyId);
  if (!property) {
    return Response.json({ error: "Property not found" }, { status: 404 });
  }

  // 2. Search MercadoLibre
  let rawListings;
  try {
    rawListings = await searchMeliProperties({
      type: property.type,
      operation: property.operation,
      city: property.city,
      limit: 50,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MercadoLibre search failed";
    return Response.json({ error: message }, { status: 502 });
  }

  // 3. Clean listings for Groq
  const listings = cleanListings(rawListings);

  // 4. Build search query string
  const query = [property.type, property.city].filter(Boolean).join(" ");

  // 5. Save snapshots in DB
  const analysisId = await saveSnapshots(propertyId, query, "MLV", listings);

  // 6. Stream to Groq
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: MARKET_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(property, listings),
      },
    ],
    // Save results when stream completes
    async onFinish({ text }) {
      const parsed = parseAnalysisResponse(text);
      if (parsed) {
        await saveAnalysisResults(analysisId, parsed);
      }
    },
  });

  // 7. Return stream + metadata in headers
  return result.toTextStreamResponse({
    headers: {
      "X-Analysis-Id": analysisId,
      "X-Listings-Count": String(listings.length),
      "X-Listings": Buffer.from(JSON.stringify(listings)).toString("base64"),
    },
  });
}
