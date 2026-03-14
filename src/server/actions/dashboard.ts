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

  // Contacts by source
  const contactsBySource = await db
    .select({
      source: contacts.source,
      count: sql<number>`count(*)::int`,
    })
    .from(contacts)
    .groupBy(contacts.source);

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
    contactsBySource,
    recentContacts,
    recentProperties,
  };
}
