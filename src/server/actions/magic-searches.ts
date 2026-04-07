"use server";

import { db } from "@/lib/db";
import { magicSearches } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedSearchParams {
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

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Create a new saved search (called from chat route)
// ---------------------------------------------------------------------------

export async function createMagicSearch(data: {
  userId: string;
  query: string;
  params: SavedSearchParams;
  kpis: Record<string, unknown>;
  messages: ChatMsg[];
  totalResults: number;
  dedupResults: number;
  label: string;
}) {
  const [search] = await db
    .insert(magicSearches)
    .values({
      userId: data.userId,
      query: data.query,
      params: data.params,
      kpis: data.kpis,
      messages: data.messages,
      totalResults: data.totalResults,
      dedupResults: data.dedupResults,
      label: data.label,
    })
    .returning();

  return search;
}

// ---------------------------------------------------------------------------
// Update messages in a saved search (append assistant response)
// ---------------------------------------------------------------------------

export async function updateSearchMessages(
  searchId: string,
  messages: ChatMsg[],
) {
  const userId = await requireUserId();

  await db
    .update(magicSearches)
    .set({ messages })
    .where(and(eq(magicSearches.id, searchId), eq(magicSearches.userId, userId)));
}

// ---------------------------------------------------------------------------
// Get all saved searches for current user (sidebar list)
// ---------------------------------------------------------------------------

export async function getMagicSearches() {
  const userId = await requireUserId();

  return db.query.magicSearches.findMany({
    where: eq(magicSearches.userId, userId),
    orderBy: [desc(magicSearches.createdAt)],
    columns: {
      id: true,
      query: true,
      label: true,
      totalResults: true,
      dedupResults: true,
      createdAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Get a single saved search by ID (for zone page + chat restore)
// ---------------------------------------------------------------------------

export async function getMagicSearch(id: string) {
  const userId = await requireUserId();

  return db.query.magicSearches.findFirst({
    where: and(eq(magicSearches.id, id), eq(magicSearches.userId, userId)),
  });
}

// ---------------------------------------------------------------------------
// Delete a saved search
// ---------------------------------------------------------------------------

export async function deleteMagicSearch(id: string) {
  const userId = await requireUserId();

  await db
    .delete(magicSearches)
    .where(and(eq(magicSearches.id, id), eq(magicSearches.userId, userId)));
}
