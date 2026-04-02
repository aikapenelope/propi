"use server";

import { db } from "@/lib/db";
import { appointments } from "@/server/schema";
import { eq, and, gte, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helper";

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
  const userId = await requireUserId();
  const conditions: SQL[] = [eq(appointments.userId, userId)];

  if (from) {
    conditions.push(gte(appointments.startsAt, from));
  }
  if (to) {
    conditions.push(lte(appointments.startsAt, to));
  }

  return db.query.appointments.findMany({
    where: and(...conditions),
    with: {
      contact: true,
      property: true,
    },
    orderBy: [appointments.startsAt],
  });
}

export async function getUpcomingAppointments(limit = 5) {
  const userId = await requireUserId();

  return db.query.appointments.findMany({
    where: and(
      eq(appointments.userId, userId),
      gte(appointments.startsAt, new Date()),
    ),
    with: {
      contact: true,
      property: true,
    },
    orderBy: [appointments.startsAt],
    limit,
  });
}

export async function getAppointment(id: string) {
  const userId = await requireUserId();

  return db.query.appointments.findFirst({
    where: and(eq(appointments.id, id), eq(appointments.userId, userId)),
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
  const userId = await requireUserId();

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
      userId,
    })
    .returning();

  revalidatePath("/calendar");
  return appointment;
}

export async function updateAppointment(
  id: string,
  data: AppointmentFormData,
) {
  const userId = await requireUserId();

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
    .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
    .returning();

  revalidatePath("/calendar");
  return appointment;
}

export async function deleteAppointment(id: string) {
  const userId = await requireUserId();
  await db
    .delete(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
  revalidatePath("/calendar");
}
