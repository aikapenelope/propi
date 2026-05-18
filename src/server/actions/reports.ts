"use server";

import { db } from "@/lib/db";
import {
  contacts,
  properties,
  appointments,
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

/** Extended report data for the professional PDF export. */
export interface FullReportData extends ReportData {
  agentName: string;
  generatedAt: string;
  inventory: {
    items: {
      id: string;
      title: string;
      type: string;
      operation: string;
      price: number;
      currency: string;
      city: string;
      daysOnMarket: number;
    }[];
    totalActive: number;
    avgPrice: number;
  };
  transactionSubtotals: {
    sales: { count: number; volume: number; commission: number };
    rentals: { count: number; volume: number; commission: number };
    avgCommissionRate: number;
  };
  activityComparison: {
    metric: string;
    current: number;
    previous: number;
    delta: number;
  }[];
}

// ---------------------------------------------------------------------------
// Public API (requires auth)
// ---------------------------------------------------------------------------

export async function getReportData(period: ReportPeriod): Promise<ReportData> {
  const userId = await requireUserId();
  return buildReport(userId, period);
}

/** Build the full report with inventory and subtotals for PDF export. */
export async function getFullReportData(
  period: ReportPeriod,
): Promise<FullReportData> {
  const userId = await requireUserId();
  return buildFullReport(userId, period);
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

    // Activity: emails sent (email campaigns removed — always 0)
    Promise.resolve([{ count: 0 }]),

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

// ---------------------------------------------------------------------------
// Full report builder (adds inventory, subtotals, agent name for PDF)
// ---------------------------------------------------------------------------

export async function buildFullReport(
  userId: string,
  period: ReportPeriod,
): Promise<FullReportData> {
  const base = await buildReport(userId, period);
  const now = new Date();

  // Fetch agent name from Clerk
  let agentName = "Agente";
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    agentName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "Agente";
  } catch {
    // Clerk unavailable — use fallback
  }

  // Active inventory with days on market
  const activeProperties = await db
    .select({
      id: properties.id,
      title: properties.title,
      type: properties.type,
      operation: properties.operation,
      price: properties.price,
      currency: properties.currency,
      city: properties.city,
      createdAt: properties.createdAt,
    })
    .from(properties)
    .where(and(eq(properties.userId, userId), eq(properties.status, "active")))
    .orderBy(desc(properties.createdAt));

  const inventoryItems = activeProperties.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    operation: p.operation,
    price: parseFloat(p.price || "0"),
    currency: p.currency || "USD",
    city: p.city || "",
    daysOnMarket: Math.floor(
      (now.getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  const avgPrice =
    inventoryItems.length > 0
      ? Math.round(
          inventoryItems.reduce((s, i) => s + i.price, 0) /
            inventoryItems.length,
        )
      : 0;

  // Transaction subtotals by operation
  const salesDeals = base.transactions.deals.filter(
    (d) => d.operation === "sale" || d.operation === "sell",
  );
  const rentalDeals = base.transactions.deals.filter(
    (d) => d.operation === "rent" || d.operation === "lease",
  );

  const allRates = base.transactions.deals.map((d) => d.commissionRate);
  const avgCommissionRate =
    allRates.length > 0
      ? Math.round(
          (allRates.reduce((s, r) => s + r, 0) / allRates.length) * 100,
        ) / 100
      : 0;

  // Activity comparison table (current vs previous period)
  const prevApts = base.comparison.appointmentsDelta;
  const prevLeads = base.comparison.leadsDelta;
  const prevTx = base.comparison.transactionsDelta;

  const activityComparison = [
    {
      metric: "Transacciones cerradas",
      current: base.transactions.closed,
      previous: prevTx === 0 ? base.transactions.closed : Math.round(base.transactions.closed / (1 + prevTx / 100)),
      delta: prevTx,
    },
    {
      metric: "Leads nuevos",
      current: base.pipeline.newLeads,
      previous: prevLeads === 0 ? base.pipeline.newLeads : Math.round(base.pipeline.newLeads / (1 + prevLeads / 100)),
      delta: prevLeads,
    },
    {
      metric: "Citas creadas",
      current: base.activity.appointmentsCreated,
      previous: prevApts === 0 ? base.activity.appointmentsCreated : Math.round(base.activity.appointmentsCreated / (1 + prevApts / 100)),
      delta: prevApts,
    },
    {
      metric: "Citas completadas",
      current: base.activity.appointmentsCompleted,
      previous: 0,
      delta: 0,
    },
    {
      metric: "Notas tomadas",
      current: base.activity.notesTaken,
      previous: 0,
      delta: 0,
    },
    {
      metric: "Emails enviados",
      current: base.activity.emailsSent,
      previous: 0,
      delta: 0,
    },
  ];

  return {
    ...base,
    agentName,
    generatedAt: now.toISOString(),
    inventory: {
      items: inventoryItems,
      totalActive: inventoryItems.length,
      avgPrice,
    },
    transactionSubtotals: {
      sales: {
        count: salesDeals.length,
        volume: salesDeals.reduce((s, d) => s + d.soldPrice, 0),
        commission: salesDeals.reduce((s, d) => s + d.commission, 0),
      },
      rentals: {
        count: rentalDeals.length,
        volume: rentalDeals.reduce((s, d) => s + d.soldPrice, 0),
        commission: rentalDeals.reduce((s, d) => s + d.commission, 0),
      },
      avgCommissionRate,
    },
    activityComparison,
  };
}
