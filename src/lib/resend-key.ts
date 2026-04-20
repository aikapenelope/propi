"use server";

import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get the Resend API key for a user.
 * Returns the user's own key from socialAccounts, or null to fall back to global.
 */
export async function getUserResendKey(userId: string): Promise<string | null> {
  const account = await db.query.socialAccounts.findFirst({
    where: and(
      eq(socialAccounts.platform, "resend"),
      eq(socialAccounts.userId, userId),
    ),
    columns: { accessToken: true },
  });

  return account?.accessToken || null;
}
