"use server";

import { db } from "@/lib/db";
import { dripSequences, dripEnrollments, contacts } from "@/server/schema";
import { eq, and, desc, lte } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DripStep {
  delayDays: number;
  subject: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Sequences CRUD
// ---------------------------------------------------------------------------

export async function getDripSequences() {
  const userId = await requireUserId();

  return db.query.dripSequences.findMany({
    where: eq(dripSequences.userId, userId),
    orderBy: [desc(dripSequences.createdAt)],
    with: {
      enrollments: {
        columns: { id: true, status: true },
      },
    },
  });
}

export async function getDripSequence(id: string) {
  const userId = await requireUserId();

  return db.query.dripSequences.findFirst({
    where: and(eq(dripSequences.id, id), eq(dripSequences.userId, userId)),
    with: {
      enrollments: {
        with: { contact: { columns: { id: true, name: true, email: true } } },
        orderBy: [desc(dripEnrollments.createdAt)],
      },
    },
  });
}

export async function createDripSequence(name: string, steps: DripStep[]) {
  const userId = await requireUserId();

  if (!name.trim()) throw new Error("El nombre es requerido");
  if (steps.length === 0) throw new Error("Agrega al menos un paso");
  for (const step of steps) {
    if (!step.subject.trim() || !step.body.trim()) {
      throw new Error("Cada paso necesita asunto y contenido");
    }
    if (step.delayDays < 0) throw new Error("El delay no puede ser negativo");
  }

  const [seq] = await db
    .insert(dripSequences)
    .values({ userId, name: name.trim(), steps })
    .returning();

  revalidatePath("/marketing/drip");
  return seq;
}

export async function updateDripSequence(
  id: string,
  data: { name?: string; steps?: DripStep[]; active?: boolean },
) {
  const userId = await requireUserId();

  await db
    .update(dripSequences)
    .set(data)
    .where(and(eq(dripSequences.id, id), eq(dripSequences.userId, userId)));

  revalidatePath("/marketing/drip");
}

export async function deleteDripSequence(id: string) {
  const userId = await requireUserId();

  await db
    .delete(dripSequences)
    .where(and(eq(dripSequences.id, id), eq(dripSequences.userId, userId)));

  revalidatePath("/marketing/drip");
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export async function enrollContact(sequenceId: string, contactId: string) {
  const userId = await requireUserId();

  // Verify ownership of both
  const [seq, contact] = await Promise.all([
    db.query.dripSequences.findFirst({
      where: and(eq(dripSequences.id, sequenceId), eq(dripSequences.userId, userId)),
      columns: { id: true, steps: true },
    }),
    db.query.contacts.findFirst({
      where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
      columns: { id: true, email: true },
    }),
  ]);

  if (!seq) throw new Error("Secuencia no encontrada");
  if (!contact) throw new Error("Contacto no encontrado");
  if (!contact.email) throw new Error("El contacto no tiene email");

  const steps = seq.steps as DripStep[];
  const firstDelay = steps[0]?.delayDays ?? 0;
  const nextRunAt = new Date(Date.now() + firstDelay * 24 * 60 * 60 * 1000);

  // Check if already enrolled
  const existing = await db.query.dripEnrollments.findFirst({
    where: and(
      eq(dripEnrollments.sequenceId, sequenceId),
      eq(dripEnrollments.contactId, contactId),
      eq(dripEnrollments.status, "active"),
    ),
  });
  if (existing) throw new Error("El contacto ya esta en esta secuencia");

  const [enrollment] = await db
    .insert(dripEnrollments)
    .values({
      sequenceId,
      contactId,
      userId,
      currentStep: 0,
      nextRunAt,
    })
    .returning();

  revalidatePath("/marketing/drip");
  return enrollment;
}

export async function unenrollContact(enrollmentId: string) {
  const userId = await requireUserId();

  await db
    .update(dripEnrollments)
    .set({ status: "cancelled" })
    .where(
      and(eq(dripEnrollments.id, enrollmentId), eq(dripEnrollments.userId, userId)),
    );

  revalidatePath("/marketing/drip");
}

// ---------------------------------------------------------------------------
// Get pending enrollments (for cron processor)
// ---------------------------------------------------------------------------

export async function getPendingDripEmails() {
  const now = new Date();

  return db.query.dripEnrollments.findMany({
    where: and(
      eq(dripEnrollments.status, "active"),
      lte(dripEnrollments.nextRunAt, now),
    ),
    with: {
      sequence: true,
      contact: { columns: { id: true, name: true, email: true } },
    },
    limit: 50,
  });
}

// ---------------------------------------------------------------------------
// Advance enrollment to next step (called by cron after sending email)
// ---------------------------------------------------------------------------

export async function advanceEnrollment(enrollmentId: string, totalSteps: number) {
  const enrollment = await db.query.dripEnrollments.findFirst({
    where: eq(dripEnrollments.id, enrollmentId),
    with: { sequence: { columns: { steps: true } } },
  });

  if (!enrollment) return;

  const nextStep = enrollment.currentStep + 1;
  const steps = enrollment.sequence.steps as DripStep[];

  if (nextStep >= totalSteps) {
    // Sequence complete
    await db
      .update(dripEnrollments)
      .set({
        currentStep: nextStep,
        status: "completed",
        completedAt: new Date(),
        nextRunAt: null,
      })
      .where(eq(dripEnrollments.id, enrollmentId));
  } else {
    // Schedule next step
    const nextDelay = steps[nextStep]?.delayDays ?? 1;
    const nextRunAt = new Date(Date.now() + nextDelay * 24 * 60 * 60 * 1000);

    await db
      .update(dripEnrollments)
      .set({ currentStep: nextStep, nextRunAt })
      .where(eq(dripEnrollments.id, enrollmentId));
  }
}
