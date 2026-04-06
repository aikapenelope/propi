import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { parseMarketQuery } from "@/lib/market-parser";
import { MARKET_SUMMARY_PROMPT, buildSummaryPrompt } from "@/lib/groq";
import {
  searchMarketListings,
  getMarketKPIs,
} from "@/server/actions/market-listings";
import { createMagicSearch } from "@/server/actions/magic-searches";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Per-user rate limit: 20 requests per hour
const userChatLimits = new Map<string, { count: number; resetAt: number }>();
const CHAT_LIMIT = 20;
const CHAT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit per user
  const now = Date.now();
  const entry = userChatLimits.get(userId);
  if (entry && now < entry.resetAt && entry.count >= CHAT_LIMIT) {
    return Response.json(
      { error: "Limite de consultas alcanzado (20/hora). Intenta mas tarde." },
      { status: 429 },
    );
  }
  if (!entry || now >= (entry?.resetAt ?? 0)) {
    userChatLimits.set(userId, { count: 1, resetAt: now + CHAT_WINDOW_MS });
  } else {
    entry.count++;
  }

  const { messages } = await req.json();

  if (!messages || messages.length === 0) {
    return Response.json({ error: "No messages" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage.content as string;

  // 1. Parse natural language into SQL parameters
  const parsed = parseMarketQuery(userQuery);

  // 2. Query market_listings (SQL, deterministic)
  const listings = await searchMarketListings(parsed, 20);

  // 3. Get KPIs (SQL, deterministic)
  const kpis = await getMarketKPIs(parsed);

  // 4. Build prompt with SQL data
  const summaryPrompt = buildSummaryPrompt(
    userQuery,
    kpis,
    listings.map((l) => ({
      title: l.title || "",
      price: l.price,
      areaM2: l.areaM2,
      neighborhood: l.neighborhood,
    })),
  );

  // 5. Save search to DB for persistence
  const zoneLabel = [
    parsed.propertyType,
    parsed.neighborhood || parsed.city || "Venezuela",
  ]
    .filter(Boolean)
    .join(" en ");

  const savedSearch = await createMagicSearch({
    userId,
    query: userQuery,
    params: parsed as unknown as Record<string, unknown>,
    kpis: kpis as unknown as Record<string, unknown>,
    messages: [{ role: "user", content: userQuery }],
    totalResults: kpis.total,
    dedupResults: 0, // Updated later when zone page loads
    label: zoneLabel,
  });

  // 6. Stream Groq summary (text only, no numbers calculation)
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: MARKET_SUMMARY_PROMPT,
    messages: [{ role: "user", content: summaryPrompt }],
  });

  // 6. Return stream + listings + KPIs in headers
  const listingsJson = JSON.stringify(
    listings.map((l) => ({
      id: l.id,
      externalId: l.externalId,
      title: l.title,
      price: l.price,
      currency: l.currency,
      areaM2: l.areaM2,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      parking: l.parking,
      propertyType: l.propertyType,
      neighborhood: l.neighborhood,
      city: l.city,
      permalink: l.permalink,
      thumbnail: l.thumbnail,
    })),
  );

  return result.toTextStreamResponse({
    headers: {
      "X-Listings": Buffer.from(listingsJson).toString("base64"),
      "X-KPIs": Buffer.from(JSON.stringify(kpis)).toString("base64"),
      "X-Total": String(kpis.total),
      "X-Query": Buffer.from(JSON.stringify(parsed)).toString("base64"),
      "X-Search-Id": savedSearch.id,
    },
  });
}
