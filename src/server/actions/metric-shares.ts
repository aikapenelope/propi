"use server";

import { db } from "@/lib/db";
import { metricShares, scheduledReports } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricShareData {
  brokerEmail: string;
  permissions?: {
    pipeline: boolean;
    transactions: boolean;
    activity: boolean;
    contactsCount: boolean;
  };
}

export interface ScheduledReportData {
  recipientEmail: string;
  frequency: "weekly" | "monthly";
}

// ---------------------------------------------------------------------------
// Metric Shares CRUD
// ---------------------------------------------------------------------------

/** List all active/pending shares for the current agent */
export async function getMyShares() {
  const userId = await requireUserId();

  return db.query.metricShares.findMany({
    where: eq(metricShares.agentId, userId),
    orderBy: [desc(metricShares.createdAt)],
  });
}

/** Create a new metric share (agent shares with broker) */
export async function createMetricShare(data: MetricShareData) {
  const userId = await requireUserId();

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
      brokerEmail: data.brokerEmail.trim().toLowerCase(),
      status: "active",
      permissions,
    })
    .returning();

  revalidatePath("/settings");
  return share;
}

/** Revoke an existing share */
export async function revokeMetricShare(shareId: string) {
  const userId = await requireUserId();

  await db
    .update(metricShares)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(and(eq(metricShares.id, shareId), eq(metricShares.agentId, userId)));

  revalidatePath("/settings");
}

/** Delete a share permanently */
export async function deleteMetricShare(shareId: string) {
  const userId = await requireUserId();

  await db
    .delete(metricShares)
    .where(and(eq(metricShares.id, shareId), eq(metricShares.agentId, userId)));

  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Scheduled Reports CRUD
// ---------------------------------------------------------------------------

/** List scheduled reports for the current user */
export async function getMyScheduledReports() {
  const userId = await requireUserId();

  return db.query.scheduledReports.findMany({
    where: eq(scheduledReports.userId, userId),
    orderBy: [desc(scheduledReports.createdAt)],
  });
}

/** Create a new scheduled report */
export async function createScheduledReport(data: ScheduledReportData) {
  const userId = await requireUserId();

  // Calculate next run date
  const now = new Date();
  let nextRunAt: Date;
  if (data.frequency === "weekly") {
    // Next Monday
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextRunAt = new Date(now);
    nextRunAt.setDate(now.getDate() + daysUntilMonday);
    nextRunAt.setHours(8, 0, 0, 0);
  } else {
    // First of next month
    nextRunAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
  }

  const [report] = await db
    .insert(scheduledReports)
    .values({
      userId,
      recipientEmail: data.recipientEmail.trim().toLowerCase(),
      frequency: data.frequency,
      active: true,
      nextRunAt,
    })
    .returning();

  revalidatePath("/settings");
  return report;
}

/** Toggle a scheduled report active/inactive */
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
      and(
        eq(scheduledReports.id, reportId),
        eq(scheduledReports.userId, userId),
      ),
    );

  revalidatePath("/settings");
}

/** Delete a scheduled report */
export async function deleteScheduledReport(reportId: string) {
  const userId = await requireUserId();

  await db
    .delete(scheduledReports)
    .where(
      and(
        eq(scheduledReports.id, reportId),
        eq(scheduledReports.userId, userId),
      ),
    );

  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Broker: get agents who shared with me
// ---------------------------------------------------------------------------

/** Get all agents who have shared metrics with the current user's email */
export async function getSharedWithMe() {
  const userId = await requireUserId();

  // We need the user's email to match against brokerEmail.
  // Since we use Clerk, the userId is the identifier. For the broker dashboard,
  // we match by brokerEmail which the broker provides when they log in.
  // For now, we'll query by the userId stored in brokerEmail field
  // (agents enter the broker's Clerk userId or email).
  return db.query.metricShares.findMany({
    where: and(
      eq(metricShares.brokerEmail, userId),
      eq(metricShares.status, "active"),
    ),
    orderBy: [desc(metricShares.createdAt)],
  });
}
