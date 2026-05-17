"use server";

import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helper";
import { maybeDecrypt, maybeEncrypt } from "@/lib/crypto";

type Platform = "instagram" | "facebook" | "whatsapp" | "mercadolibre" | "wasi" | "resend";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decrypt token fields on a social account row. */
function decryptAccount<
  T extends { accessToken: string; refreshToken: string | null },
>(account: T): T {
  return {
    ...account,
    accessToken: maybeDecrypt(account.accessToken),
    refreshToken: account.refreshToken
      ? maybeDecrypt(account.refreshToken)
      : null,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get a social account for the current user by platform. */
export async function getSocialAccount(platform: Platform) {
  const userId = await requireUserId();
  const account = await db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, platform),
      eq(socialAccounts.userId, userId),
    ),
  });
  return account ? decryptAccount(account) : account;
}

/** Get all social accounts for the current user. */
export async function getAllSocialAccounts() {
  const userId = await requireUserId();
  const accounts = await db.query.socialAccounts.findMany({
    where: eq(socialAccounts.userId, userId),
  });
  return accounts.map(decryptAccount);
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

  const encryptedAccessToken = maybeEncrypt(data.accessToken);
  const encryptedRefreshToken = data.refreshToken
    ? maybeEncrypt(data.refreshToken)
    : null;

  if (existing) {
    await db
      .update(socialAccounts)
      .set({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
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
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
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
