"use server";

import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helper";

type Platform = "instagram" | "facebook" | "whatsapp" | "mercadolibre" | "wasi" | "resend";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get a social account for the current user by platform. */
export async function getSocialAccount(platform: Platform) {
  const userId = await requireUserId();
  return db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, platform),
      eq(socialAccounts.userId, userId),
    ),
  });
}

/** Get all social accounts for the current user. */
export async function getAllSocialAccounts() {
  const userId = await requireUserId();
  return db.query.socialAccounts.findMany({
    where: eq(socialAccounts.userId, userId),
  });
}

/**
 * Resolve which user owns a platformAccountId.
 * Used by the Meta webhook to route inbound messages to the correct user.
 * This does NOT require auth (webhooks are unauthenticated).
 */
export async function resolveUserIdByPlatformAccount(
  platform: Platform,
  platformAccountId: string,
): Promise<string | null> {
  const account = await db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, platform),
      eq(socialAccounts.platformAccountId, platformAccountId),
    ),
  });
  return account?.userId || null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function upsertSocialAccount(data: {
  platform: Platform;
  accessToken: string;
  platformAccountId: string;
  accountName?: string;
  refreshToken?: string;
  tokenExpiresAt?: string; // ISO date
  metadata?: Record<string, unknown>;
  /** Pass userId explicitly for OAuth callbacks where auth() may not work */
  userId?: string;
}) {
  const userId = data.userId || (await requireUserId());

  const existing = await db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, data.platform),
      eq(socialAccounts.userId, userId),
    ),
  });

  if (existing) {
    await db
      .update(socialAccounts)
      .set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || null,
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
      refreshToken: data.refreshToken || null,
      platformAccountId: data.platformAccountId,
      accountName: data.accountName || null,
      tokenExpiresAt: data.tokenExpiresAt
        ? new Date(data.tokenExpiresAt)
        : null,
      metadata: data.metadata || null,
      userId,
    });
  }

  revalidatePath("/marketing/settings");
}

export async function deleteSocialAccount(platform: Platform) {
  const userId = await requireUserId();
  await db
    .delete(socialAccounts)
    .where(
      and(eq(socialAccounts.platform, platform), eq(socialAccounts.userId, userId)),
    );
  revalidatePath("/marketing/settings");
}
