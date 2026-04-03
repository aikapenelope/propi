"use server";

import { db } from "@/lib/db";
import { contacts, properties, appointments } from "@/server/schema";
import { sql, eq, gte, lte, and, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

export async function getDashboardStats() {
  const userId = await requireUserId();

  // Properties by status
  const propertiesByStatus = await db
    .select({
      status: properties.status,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .where(eq(properties.userId, userId))
    .groupBy(properties.status);

  // Properties by type (for bar chart)
  const propertiesByType = await db
    .select({
      type: properties.type,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .where(eq(properties.userId, userId))
    .groupBy(properties.type)
    .orderBy(desc(sql`count(*)`));

  // Contacts by source
  const contactsBySource = await db
    .select({
      source: contacts.source,
      count: sql<number>`count(*)::int`,
    })
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .groupBy(contacts.source);

  // Contacts created per month (last 6 months, for area chart)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const contactsByMonth = await db
    .select({
      month: sql<string>`TO_CHAR(${contacts.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        gte(contacts.createdAt, sixMonthsAgo),
      ),
    )
    .groupBy(sql`TO_CHAR(${contacts.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${contacts.createdAt}, 'YYYY-MM')`);

  // Total counts
  const [propertyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties)
    .where(eq(properties.userId, userId));
  const [contactCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(eq(contacts.userId, userId));

  // This week's appointments
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [appointmentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.startsAt, weekStart),
        lte(appointments.startsAt, weekEnd),
      ),
    );

  // Appointments by day of week (for column chart)
  const appointmentsByDay = await db
    .select({
      day: sql<number>`EXTRACT(DOW FROM ${appointments.startsAt})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.startsAt, weekStart),
        lte(appointments.startsAt, weekEnd),
      ),
    )
    .groupBy(sql`EXTRACT(DOW FROM ${appointments.startsAt})`);

  // Recent contacts
  const recentContacts = await db.query.contacts.findMany({
    where: eq(contacts.userId, userId),
    orderBy: [desc(contacts.createdAt)],
    limit: 5,
  });

  // Recent properties
  const recentProperties = await db.query.properties.findMany({
    where: eq(properties.userId, userId),
    orderBy: [desc(properties.createdAt)],
    limit: 5,
  });

  return {
    totalProperties: propertyCount.count,
    totalContacts: contactCount.count,
    appointmentsThisWeek: appointmentCount.count,
    propertiesByStatus,
    propertiesByType,
    contactsBySource,
    contactsByMonth,
    appointmentsByDay,
    recentContacts,
    recentProperties,
  };
}
