"use server";

import { db } from "@/lib/db";
import { appointments } from "@/server/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppointmentFormData = {
  title: string;
  description?: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  status?: string;
  location?: string;
  contactId?: string;
  propertyId?: string;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAppointments(from?: Date, to?: Date) {
  const conditions = [];

  if (from) {
    conditions.push(gte(appointments.startsAt, from));
  }
  if (to) {
    conditions.push(lte(appointments.startsAt, to));
  }

  return db.query.appointments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      contact: true,
      property: true,
    },
    orderBy: [appointments.startsAt],
  });
}

export async function getUpcomingAppointments(limit = 5) {
  return db.query.appointments.findMany({
    where: gte(appointments.startsAt, new Date()),
    with: {
      contact: true,
      property: true,
    },
    orderBy: [appointments.startsAt],
    limit,
  });
}

export async function getAppointment(id: string) {
  return db.query.appointments.findFirst({
    where: eq(appointments.id, id),
    with: {
      contact: true,
      property: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createAppointment(data: AppointmentFormData) {
  const [appointment] = await db
    .insert(appointments)
    .values({
      title: data.title,
      description: data.description || null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      status:
        (data.status as typeof appointments.$inferInsert.status) || "scheduled",
      location: data.location || null,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
    })
    .returning();

  revalidatePath("/calendar");
  return appointment;
}

export async function updateAppointment(
  id: string,
  data: AppointmentFormData,
) {
  const [appointment] = await db
    .update(appointments)
    .set({
      title: data.title,
      description: data.description || null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      status:
        (data.status as typeof appointments.$inferInsert.status) || "scheduled",
      location: data.location || null,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
    })
    .where(eq(appointments.id, id))
    .returning();

  revalidatePath("/calendar");
  return appointment;
}

export async function deleteAppointment(id: string) {
  await db.delete(appointments).where(eq(appointments.id, id));
  revalidatePath("/calendar");
}
