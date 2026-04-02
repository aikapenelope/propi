"use server";

import { db } from "@/lib/db";
import { contacts, properties, appointments } from "@/server/schema";
import { sql, gte, lte, and, desc } from "drizzle-orm";

export async function getDashboardStats() {
  // Properties by status
  const propertiesByStatus = await db
    .select({
      status: properties.status,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .groupBy(properties.status);

  // Properties by type (for bar chart)
  const propertiesByType = await db
    .select({
      type: properties.type,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .groupBy(properties.type)
    .orderBy(desc(sql`count(*)`));

  // Contacts by source
  const contactsBySource = await db
    .select({
      source: contacts.source,
      count: sql<number>`count(*)::int`,
    })
    .from(contacts)
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
    .where(gte(contacts.createdAt, sixMonthsAgo))
    .groupBy(sql`TO_CHAR(${contacts.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${contacts.createdAt}, 'YYYY-MM')`);

  // Total counts
  const [propertyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(properties);
  const [contactCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts);

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
        gte(appointments.startsAt, weekStart),
        lte(appointments.startsAt, weekEnd),
      ),
    )
    .groupBy(sql`EXTRACT(DOW FROM ${appointments.startsAt})`);

  // Recent contacts
  const recentContacts = await db.query.contacts.findMany({
    orderBy: [desc(contacts.createdAt)],
    limit: 5,
  });

  // Recent properties
  const recentProperties = await db.query.properties.findMany({
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
