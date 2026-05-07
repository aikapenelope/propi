"use server";

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
import { requireUserId } from "@/lib/auth-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportPeriod {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface ReportData {
  period: ReportPeriod;
  summary: {
    totalProperties: number;
    activeProperties: number;
    soldProperties: number;
    rentedProperties: number;
    reservedProperties: number;
  };
  transactions: {
    closed: number;
    totalVolume: number;
    totalCommission: number;
    avgPrice: number;
    avgCommissionRate: number;
    deals: {
      id: string;
      title: string;
      operation: string;
      soldPrice: number;
      commissionRate: number;
      commission: number;
      closedAt: string;
    }[];
  };
  pipeline: {
    stages: { stage: string; count: number }[];
    newLeads: number;
    closedLeads: number;
    conversionRate: number;
  };
  activity: {
    appointmentsCreated: number;
    appointmentsCompleted: number;
    contactsCreated: number;
    notesTaken: number;
    emailsSent: number;
    activitiesLogged: number;
  };
  comparison: {
    transactionsDelta: number;
    volumeDelta: number;
    leadsDelta: number;
    appointmentsDelta: number;
  };
}

// ---------------------------------------------------------------------------
// Main report query
// ---------------------------------------------------------------------------

export async function getReportData(period: ReportPeriod): Promise<ReportData> {
  const userId = await requireUserId();
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  // Calculate previous period (same duration, immediately before)
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
    // Summary: properties by status (all time)
    db
      .select({
        status: properties.status,
        count: sql<number>`count(*)::int`,
      })
      .from(properties)
      .where(eq(properties.userId, userId))
      .groupBy(properties.status),

    // Transactions: closed deals in period
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

    // Pipeline: contacts by lead status (current snapshot)
    db
      .select({
        stage: contacts.leadStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .groupBy(contacts.leadStatus),

    // Activity in period
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

    // Previous period: transactions count
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

    // Previous period: new leads
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

    // Previous period: appointments
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

  // Process summary
  const totalProperties = summaryResult.reduce((s, r) => s + r.count, 0);
  const activeProperties =
    summaryResult.find((r) => r.status === "active")?.count ?? 0;
  const soldProperties =
    summaryResult.find((r) => r.status === "sold")?.count ?? 0;
  const rentedProperties =
    summaryResult.find((r) => r.status === "rented")?.count ?? 0;
  const reservedProperties =
    summaryResult.find((r) => r.status === "reserved")?.count ?? 0;

  // Process transactions
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

  // Process pipeline
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

  // Process activity
  const [
    aptsCreated,
    aptsCompleted,
    contactsCreated,
    notesTaken,
    emailsSent,
    activitiesLogged,
  ] = activityResult;

  // Process comparison
  const prevTransCount = prevTransactions[0]?.count ?? 0;
  const prevLeadsCount = prevLeads[0]?.count ?? 0;
  const prevAptsCount = prevAppointments[0]?.count ?? 0;
  const currentTransCount = deals.length;
  const currentLeadsCount = newLeads;
  const currentAptsCount = aptsCreated[0]?.count ?? 0;

  // Calculate previous volume for comparison
  const transactionsDelta =
    prevTransCount > 0
      ? Math.round(
          ((currentTransCount - prevTransCount) / prevTransCount) * 100,
        )
      : currentTransCount > 0
        ? 100
        : 0;

  const leadsDelta =
    prevLeadsCount > 0
      ? Math.round(
          ((currentLeadsCount - prevLeadsCount) / prevLeadsCount) * 100,
        )
      : currentLeadsCount > 0
        ? 100
        : 0;

  const appointmentsDelta =
    prevAptsCount > 0
      ? Math.round(((currentAptsCount - prevAptsCount) / prevAptsCount) * 100)
      : currentAptsCount > 0
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
      transactionsDelta,
      volumeDelta: transactionsDelta, // same trend as transactions for now
      leadsDelta,
      appointmentsDelta,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: get report for a specific user (used by broker dashboard)
// ---------------------------------------------------------------------------

export async function getReportDataForUser(
  targetUserId: string,
  period: ReportPeriod,
): Promise<ReportData> {
  // Verify the caller has access (is a broker with active share)
  const callerUserId = await requireUserId();

  // If caller is requesting their own data, allow
  if (callerUserId === targetUserId) {
    return getReportDataInternal(targetUserId, period);
  }

  // Otherwise check metric_shares
  const { metricShares } = await import("@/server/schema");
  const share = await db.query.metricShares.findFirst({
    where: and(
      eq(metricShares.agentId, targetUserId),
      eq(metricShares.brokerEmail, callerUserId), // broker identified by userId here
      eq(metricShares.status, "active"),
    ),
  });

  if (!share) {
    throw new Error("No tienes acceso a las metricas de este agente");
  }

  return getReportDataInternal(targetUserId, period);
}

// Internal version that skips auth (used when access is already verified)
async function getReportDataInternal(
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

  // Process (same logic as getReportData)
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

  const transactionsDelta =
    prevTransCount > 0
      ? Math.round(
          ((currentTransCount - prevTransCount) / prevTransCount) * 100,
        )
      : currentTransCount > 0
        ? 100
        : 0;

  const leadsDelta =
    prevLeadsCount > 0
      ? Math.round(
          ((currentLeadsCount - prevLeadsCount) / prevLeadsCount) * 100,
        )
      : currentLeadsCount > 0
        ? 100
        : 0;

  const appointmentsDelta =
    prevAptsCount > 0
      ? Math.round(((currentAptsCount - prevAptsCount) / prevAptsCount) * 100)
      : currentAptsCount > 0
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
      transactionsDelta,
      volumeDelta: transactionsDelta,
      leadsDelta,
      appointmentsDelta,
    },
  };
}
