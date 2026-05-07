"use server";

import { db } from "@/lib/db";
import { metricShares, scheduledReports } from "@/server/schema";
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

export interface ScheduledReportInput {
  recipientEmail: string;
  frequency: "weekly" | "monthly";
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
// Scheduled Reports
// ---------------------------------------------------------------------------

export async function getMyScheduledReports() {
  const userId = await requireUserId();
  return db.query.scheduledReports.findMany({
    where: eq(scheduledReports.userId, userId),
    orderBy: [desc(scheduledReports.createdAt)],
  });
}

export async function createScheduledReport(data: ScheduledReportInput) {
  const userId = await requireUserId();
  const email = data.recipientEmail.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido");
  }

  // Calculate next run
  const now = new Date();
  let nextRunAt: Date;
  if (data.frequency === "weekly") {
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextRunAt = new Date(now);
    nextRunAt.setDate(now.getDate() + daysUntilMonday);
    nextRunAt.setHours(8, 0, 0, 0);
  } else {
    nextRunAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
  }

  const [report] = await db
    .insert(scheduledReports)
    .values({
      userId,
      recipientEmail: email,
      frequency: data.frequency,
      active: true,
      nextRunAt,
    })
    .returning();

  revalidatePath("/reports/sharing");
  return report;
}

export async function toggleScheduledReport(reportId: string) {
  const userId = await requireUserId();
  const existing = await db.query.scheduledReports.findFirst({
    where: and(
      eq(scheduledReports.id, reportId),
      eq(scheduledReports.userId, userId),
    ),
  });
  if (!existing) return;

  await db
    .update(scheduledReports)
    .set({ active: !existing.active })
    .where(
      and(eq(scheduledReports.id, reportId), eq(scheduledReports.userId, userId)),
    );
  revalidatePath("/reports/sharing");
}

export async function deleteScheduledReport(reportId: string) {
  const userId = await requireUserId();
  await db
    .delete(scheduledReports)
    .where(
      and(eq(scheduledReports.id, reportId), eq(scheduledReports.userId, userId)),
    );
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
