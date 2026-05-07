/**
 * Internal report generation — no auth check.
 * Used by the cron endpoint which has already verified CRON_SECRET.
 * Do NOT export from barrel files or use in client-facing code.
 */

import { db } from "@/lib/db";
import {
  contacts,
  properties,
  appointments,
  emailCampaigns,
  contactNotes,
  activityLog,
} from "@/server/schema";
import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import type { ReportData, ReportPeriod } from "./reports";

export async function getReportDataInternal(
  userId: string,
  period: ReportPeriod,
): Promise<ReportData> {
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  const durationMs = endDate.getTime() - startDate.getTime();
  const prevStart = new Date(startDate.getTime() - durationMs);
  const prevEnd = new Date(startDate.getTime());

  const [
    summaryResult,
    transactionsResult,
    pipelineResult,
    activityResult,
    prevTransactions,
    prevLeads,
    prevAppointments,
  ] = await Promise.all([
    db
      .select({
        status: properties.status,
        count: sql<number>`count(*)::int`,
      })
      .from(properties)
      .where(eq(properties.userId, userId))
      .groupBy(properties.status),

    db
      .select({
        id: properties.id,
        title: properties.title,
        operation: properties.operation,
        soldPrice: properties.soldPrice,
        commissionRate: properties.commissionRate,
        closedAt: properties.closedAt,
      })
      .from(properties)
      .where(
        and(
          eq(properties.userId, userId),
          gte(properties.closedAt, startDate),
          lte(properties.closedAt, endDate),
        ),
      )
      .orderBy(desc(properties.closedAt)),

    db
      .select({
        stage: contacts.leadStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .groupBy(contacts.leadStatus),

    Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(
          and(
            eq(appointments.userId, userId),
            gte(appointments.createdAt, startDate),
            lte(appointments.createdAt, endDate),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(
          and(
            eq(appointments.userId, userId),
            eq(appointments.status, "completed"),
            gte(appointments.createdAt, startDate),
            lte(appointments.createdAt, endDate),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            gte(contacts.createdAt, startDate),
            lte(contacts.createdAt, endDate),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contactNotes)
        .where(
          and(
            eq(contactNotes.userId, userId),
            gte(contactNotes.createdAt, startDate),
            lte(contactNotes.createdAt, endDate),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(emailCampaigns)
        .where(
          and(
            eq(emailCampaigns.userId, userId),
            gte(emailCampaigns.createdAt, startDate),
            lte(emailCampaigns.createdAt, endDate),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityLog)
        .where(
          and(
            eq(activityLog.userId, userId),
            gte(activityLog.createdAt, startDate),
            lte(activityLog.createdAt, endDate),
          ),
        ),
    ]),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(properties)
      .where(
        and(
          eq(properties.userId, userId),
          gte(properties.closedAt, prevStart),
          lte(properties.closedAt, prevEnd),
        ),
      ),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
          gte(contacts.createdAt, prevStart),
          lte(contacts.createdAt, prevEnd),
        ),
      ),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.createdAt, prevStart),
          lte(appointments.createdAt, prevEnd),
        ),
      ),
  ]);

  const totalProperties = summaryResult.reduce((s, r) => s + r.count, 0);
  const activeProperties =
    summaryResult.find((r) => r.status === "active")?.count ?? 0;
  const soldProperties =
    summaryResult.find((r) => r.status === "sold")?.count ?? 0;
  const rentedProperties =
    summaryResult.find((r) => r.status === "rented")?.count ?? 0;
  const reservedProperties =
    summaryResult.find((r) => r.status === "reserved")?.count ?? 0;

  const deals = transactionsResult.map((t) => {
    const price = parseFloat(t.soldPrice || "0");
    const rate = parseFloat(t.commissionRate || "5");
    return {
      id: t.id,
      title: t.title,
      operation: t.operation,
      soldPrice: price,
      commissionRate: rate,
      commission: price * (rate / 100),
      closedAt: t.closedAt?.toISOString() ?? "",
    };
  });

  const totalVolume = deals.reduce((s, d) => s + d.soldPrice, 0);
  const totalCommission = deals.reduce((s, d) => s + d.commission, 0);
  const avgPrice = deals.length > 0 ? totalVolume / deals.length : 0;
  const avgCommissionRate =
    deals.length > 0
      ? deals.reduce((s, d) => s + d.commissionRate, 0) / deals.length
      : 5;

  const stages = pipelineResult.map((r) => ({
    stage: r.stage,
    count: r.count,
  }));
  const newLeads = activityResult[2][0]?.count ?? 0;
  const closedLeads =
    pipelineResult.find((r) => r.stage === "closed")?.count ?? 0;
  const totalLeads = pipelineResult.reduce((s, r) => s + r.count, 0);
  const conversionRate =
    totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  const [
    aptsCreated,
    aptsCompleted,
    contactsCreated,
    notesTaken,
    emailsSent,
    activitiesLogged,
  ] = activityResult;

  const prevTransCount = prevTransactions[0]?.count ?? 0;
  const prevLeadsCount = prevLeads[0]?.count ?? 0;
  const prevAptsCount = prevAppointments[0]?.count ?? 0;
  const currentTransCount = deals.length;
  const currentLeadsCount = newLeads;
  const currentAptsCount = aptsCreated[0]?.count ?? 0;

  const calcDelta = (current: number, prev: number) =>
    prev > 0
      ? Math.round(((current - prev) / prev) * 100)
      : current > 0
        ? 100
        : 0;

  return {
    period,
    summary: {
      totalProperties,
      activeProperties,
      soldProperties,
      rentedProperties,
      reservedProperties,
    },
    transactions: {
      closed: deals.length,
      totalVolume,
      totalCommission,
      avgPrice,
      avgCommissionRate,
      deals,
    },
    pipeline: {
      stages,
      newLeads,
      closedLeads,
      conversionRate,
    },
    activity: {
      appointmentsCreated: aptsCreated[0]?.count ?? 0,
      appointmentsCompleted: aptsCompleted[0]?.count ?? 0,
      contactsCreated: contactsCreated[0]?.count ?? 0,
      notesTaken: notesTaken[0]?.count ?? 0,
      emailsSent: emailsSent[0]?.count ?? 0,
      activitiesLogged: activitiesLogged[0]?.count ?? 0,
    },
    comparison: {
      transactionsDelta: calcDelta(currentTransCount, prevTransCount),
      volumeDelta: calcDelta(currentTransCount, prevTransCount),
      leadsDelta: calcDelta(currentLeadsCount, prevLeadsCount),
      appointmentsDelta: calcDelta(currentAptsCount, prevAptsCount),
    },
  };
}
