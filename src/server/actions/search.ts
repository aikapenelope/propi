"use server";

import { db } from "@/lib/db";
import { contacts, properties, appointments } from "@/server/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";

export async function globalSearch(query: string) {
  if (!query || query.length < 2) return { contacts: [], properties: [], appointments: [] };

  const userId = await requireUserId();
  const pattern = `%${query}%`;

  const [matchedContacts, matchedProperties, matchedAppointments] =
    await Promise.all([
      db.query.contacts.findMany({
        where: and(
          eq(contacts.userId, userId),
          or(
            ilike(contacts.name, pattern),
            ilike(contacts.email, pattern),
            ilike(contacts.phone, pattern),
            ilike(contacts.company, pattern),
          ),
        ),
        orderBy: [desc(contacts.updatedAt)],
        limit: 10,
      }),
      db.query.properties.findMany({
        where: and(
          eq(properties.userId, userId),
          or(
            ilike(properties.title, pattern),
            ilike(properties.address, pattern),
            ilike(properties.city, pattern),
          ),
        ),
        orderBy: [desc(properties.updatedAt)],
        limit: 10,
      }),
      db.query.appointments.findMany({
        where: and(
          eq(appointments.userId, userId),
          or(
            ilike(appointments.title, pattern),
            ilike(appointments.location, pattern),
          ),
        ),
        orderBy: [appointments.startsAt],
        limit: 10,
      }),
    ]);

  return {
    contacts: matchedContacts,
    properties: matchedProperties,
    appointments: matchedAppointments,
  };
}
