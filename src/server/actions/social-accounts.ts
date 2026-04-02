"use server";

import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getSocialAccount(platform: "instagram" | "facebook" | "whatsapp" | "mercadolibre" | "wasi") {
  return db.query.socialAccounts.findFirst({
    where: eq(socialAccounts.platform, platform),
  });
}

export async function getAllSocialAccounts() {
  return db.query.socialAccounts.findMany();
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function upsertSocialAccount(data: {
  platform: "instagram" | "facebook" | "whatsapp" | "mercadolibre" | "wasi";
  accessToken: string;
  platformAccountId: string;
  accountName?: string;
  tokenExpiresAt?: string; // ISO date
  metadata?: Record<string, unknown>;
}) {
  const existing = await getSocialAccount(data.platform);

  if (existing) {
    await db
      .update(socialAccounts)
      .set({
        accessToken: data.accessToken,
        platformAccountId: data.platformAccountId,
        accountName: data.accountName || null,
        tokenExpiresAt: data.tokenExpiresAt
          ? new Date(data.tokenExpiresAt)
          : null,
        metadata: data.metadata || null,
      })
      .where(eq(socialAccounts.id, existing.id));
  } else {
    await db.insert(socialAccounts).values({
      platform: data.platform,
      accessToken: data.accessToken,
      platformAccountId: data.platformAccountId,
      accountName: data.accountName || null,
      tokenExpiresAt: data.tokenExpiresAt
        ? new Date(data.tokenExpiresAt)
        : null,
      metadata: data.metadata || null,
    });
  }

  revalidatePath("/marketing/settings");
}

export async function deleteSocialAccount(platform: "instagram" | "facebook" | "whatsapp" | "mercadolibre" | "wasi") {
  await db
    .delete(socialAccounts)
    .where(eq(socialAccounts.platform, platform));
  revalidatePath("/marketing/settings");
}
