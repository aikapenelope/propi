"use server";

import { db } from "@/lib/db";
import { userSettings } from "@/server/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Get settings
// ---------------------------------------------------------------------------

export async function getUserSettings() {
  const userId = await requireUserId();
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  return settings ?? { companyName: null, companyLogoKey: null };
}

/** Get settings by userId (for PDF generation, no auth context needed). */
export async function getUserSettingsByUserId(userId: string) {
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  return settings ?? { companyName: null, companyLogoKey: null };
}

// ---------------------------------------------------------------------------
// Update settings
// ---------------------------------------------------------------------------

export async function updateUserSettings(data: {
  companyName?: string;
  companyLogoKey?: string;
}) {
  const userId = await requireUserId();

  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (existing) {
    await db
      .update(userSettings)
      .set({
        companyName: data.companyName ?? existing.companyName,
        companyLogoKey: data.companyLogoKey ?? existing.companyLogoKey,
      })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({
      userId,
      companyName: data.companyName || null,
      companyLogoKey: data.companyLogoKey || null,
    });
  }

  revalidatePath("/marketing/settings");
}
