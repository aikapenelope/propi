"use server";

import { db } from "@/lib/db";
import { metricShares } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricShareInput {
  brokerEmail: string;
  permissions?: {
    pipeline: boolean;
    transactions: boolean;
    activity: boolean;
    contactsCount: boolean;
  };
}

// ---------------------------------------------------------------------------
// Metric Shares
// ---------------------------------------------------------------------------

export async function getMyShares() {
  const userId = await requireUserId();
  return db.query.metricShares.findMany({
    where: eq(metricShares.agentId, userId),
    orderBy: [desc(metricShares.createdAt)],
  });
}

export async function createMetricShare(data: MetricShareInput) {
  const userId = await requireUserId();
  const email = data.brokerEmail.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido");
  }

  const permissions = data.permissions ?? {
    pipeline: true,
    transactions: true,
    activity: true,
    contactsCount: true,
  };

  const [share] = await db
    .insert(metricShares)
    .values({
      agentId: userId,
      brokerEmail: email,
      status: "active",
      permissions,
    })
    .returning();

  revalidatePath("/reports/sharing");
  return share;
}

export async function revokeMetricShare(shareId: string) {
  const userId = await requireUserId();
  await db
    .update(metricShares)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(and(eq(metricShares.id, shareId), eq(metricShares.agentId, userId)));
  revalidatePath("/reports/sharing");
}

export async function deleteMetricShare(shareId: string) {
  const userId = await requireUserId();
  await db
    .delete(metricShares)
    .where(and(eq(metricShares.id, shareId), eq(metricShares.agentId, userId)));
  revalidatePath("/reports/sharing");
}

// ---------------------------------------------------------------------------
// Broker: get agents who shared with me (matched by email)
// ---------------------------------------------------------------------------

export async function getSharedAgentIds(brokerEmail: string): Promise<string[]> {
  const shares = await db.query.metricShares.findMany({
    where: and(
      eq(metricShares.brokerEmail, brokerEmail.toLowerCase()),
      eq(metricShares.status, "active"),
    ),
    columns: { agentId: true },
  });
  return shares.map((s) => s.agentId);
}
