"use server";

import { db } from "@/lib/db";
import {
  contacts,
  properties,
  appointments,
  emailCampaigns,
  contactNotes,
} from "@/server/schema";
import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportPeriod {
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string;
}

export interface ReportData {
  period: ReportPeriod;
  summary: {
    totalProperties: number;
    activeProperties: number;
    soldProperties: number;
    rentedProperties: number;
  };
  transactions: {
    closed: number;
    totalVolume: number;
    totalCommission: number;
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
    conversionRate: number;
  };
  activity: {
    appointmentsCreated: number;
    appointmentsCompleted: number;
    contactsCreated: number;
    notesTaken: number;
    emailsSent: number;
  };
  comparison: {
    transactionsDelta: number;
    leadsDelta: number;
    appointmentsDelta: number;
  };
}

// ---------------------------------------------------------------------------
// Public API (requires auth)
// ---------------------------------------------------------------------------

export async function getReportData(period: ReportPeriod): Promise<ReportData> {
  const userId = await requireUserId();
  return buildReport(userId, period);
}

// ---------------------------------------------------------------------------
// Core report builder (reusable for cron/broker in future sprints)
// ---------------------------------------------------------------------------

export async function buildReport(
  userId: string,
  period: ReportPeriod,
): Promise<ReportData> {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  // Set end to end-of-day to include the full last day
  end.setHours(23, 59, 59, 999);

  // Previous period of same duration for comparison
  const durationMs = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - durationMs);
  const prevEnd = new Date(start.getTime() - 1);

  const [
    statusCounts,
    closedDeals,
    pipelineStages,
    aptsCreated,
    aptsCompleted,
    newContacts,
    notes,
    campaigns,
    prevClosed,
    prevContacts,
    prevApts,
  ] = await Promise.all([
    // Properties by status (all time snapshot)
    db
      .select({ status: properties.status, count: sql<number>`count(*)::int` })
      .from(properties)
      .where(eq(properties.userId, userId))
      .groupBy(properties.status),

    // Closed deals in period
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
          gte(properties.closedAt, start),
          lte(properties.closedAt, end),
        ),
      )
      .orderBy(desc(properties.closedAt)),

    // Pipeline snapshot
    db
      .select({ stage: contacts.leadStatus, count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .groupBy(contacts.leadStatus),

    // Activity: appointments created in period
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.createdAt, start),
          lte(appointments.createdAt, end),
        ),
      ),

    // Activity: appointments completed in period
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.status, "completed"),
          gte(appointments.createdAt, start),
          lte(appointments.createdAt, end),
        ),
      ),

    // Activity: contacts created in period
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
          gte(contacts.createdAt, start),
          lte(contacts.createdAt, end),
        ),
      ),

    // Activity: notes in period
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactNotes)
      .where(
        and(
          eq(contactNotes.userId, userId),
          gte(contactNotes.createdAt, start),
          lte(contactNotes.createdAt, end),
        ),
      ),

    // Activity: total emails sent in period (sum of sentCount across campaigns)
    db
      .select({ count: sql<number>`COALESCE(SUM(${emailCampaigns.sentCount}), 0)::int` })
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.userId, userId),
          gte(emailCampaigns.createdAt, start),
          lte(emailCampaigns.createdAt, end),
        ),
      ),

    // Comparison: previous period closed deals
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

    // Comparison: previous period contacts
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

    // Comparison: previous period appointments
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
  const getCount = (status: string) =>
    statusCounts.find((r) => r.status === status)?.count ?? 0;
  const totalProperties = statusCounts.reduce((s, r) => s + r.count, 0);

  // Process transactions
  const deals = closedDeals.map((t) => {
    const price = parseFloat(t.soldPrice || "0");
    const rate = parseFloat(t.commissionRate || "5");
    return {
      id: t.id,
      title: t.title,
      operation: t.operation,
      soldPrice: price,
      commissionRate: rate,
      commission: price * (rate / 100),
      closedAt: t.closedAt?.toISOString().slice(0, 10) ?? "",
    };
  });
  const totalVolume = deals.reduce((s, d) => s + d.soldPrice, 0);
  const totalCommission = deals.reduce((s, d) => s + d.commission, 0);

  // Pipeline
  const stages = pipelineStages.map((r) => ({ stage: r.stage, count: r.count }));
  const totalLeads = pipelineStages.reduce((s, r) => s + r.count, 0);
  const closedLeads = getCount("closed");
  const conversionRate =
    totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  // Comparison deltas
  const delta = (current: number, prev: number) =>
    prev > 0 ? Math.round(((current - prev) / prev) * 100) : current > 0 ? 100 : 0;

  const currentLeads = newContacts[0]?.count ?? 0;
  const currentApts = aptsCreated[0]?.count ?? 0;

  return {
    period,
    summary: {
      totalProperties,
      activeProperties: getCount("active"),
      soldProperties: getCount("sold"),
      rentedProperties: getCount("rented"),
    },
    transactions: { closed: deals.length, totalVolume, totalCommission, deals },
    pipeline: {
      stages,
      newLeads: currentLeads,
      conversionRate,
    },
    activity: {
      appointmentsCreated: currentApts,
      appointmentsCompleted: aptsCompleted[0]?.count ?? 0,
      contactsCreated: currentLeads,
      notesTaken: notes[0]?.count ?? 0,
      emailsSent: campaigns[0]?.count ?? 0,
    },
    comparison: {
      transactionsDelta: delta(deals.length, prevClosed[0]?.count ?? 0),
      leadsDelta: delta(currentLeads, prevContacts[0]?.count ?? 0),
      appointmentsDelta: delta(currentApts, prevApts[0]?.count ?? 0),
    },
  };
}
