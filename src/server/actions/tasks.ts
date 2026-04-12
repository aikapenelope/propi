"use server";

import { db } from "@/lib/db";
import { tasks } from "@/server/schema";
import { eq, and, desc, gte, lte, asc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Get tasks (with optional filters)
// ---------------------------------------------------------------------------

export async function getTasks(filter?: "pending" | "completed" | "today" | "overdue") {
  const userId = await requireUserId();
  const conditions = [eq(tasks.userId, userId)];

  const now = new Date();

  if (filter === "pending") {
    conditions.push(eq(tasks.completed, false));
  } else if (filter === "completed") {
    conditions.push(eq(tasks.completed, true));
  } else if (filter === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    conditions.push(eq(tasks.completed, false));
    conditions.push(gte(tasks.dueAt, startOfDay));
    conditions.push(lte(tasks.dueAt, endOfDay));
  } else if (filter === "overdue") {
    conditions.push(eq(tasks.completed, false));
    conditions.push(lte(tasks.dueAt, now));
  }

  return db.query.tasks.findMany({
    where: and(...conditions),
    with: {
      contact: { columns: { id: true, name: true } },
      property: { columns: { id: true, title: true } },
    },
    orderBy: [asc(tasks.completed), asc(tasks.dueAt), desc(tasks.createdAt)],
  });
}

// ---------------------------------------------------------------------------
// Get today's tasks count (for dashboard widget)
// ---------------------------------------------------------------------------

export async function getTodayTasksCount() {
  const userId = await requireUserId();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const todayTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.userId, userId),
      eq(tasks.completed, false),
      lte(tasks.dueAt, endOfDay),
    ),
    columns: { id: true, dueAt: true },
  });

  const overdue = todayTasks.filter(
    (t) => t.dueAt && new Date(t.dueAt) < startOfDay,
  ).length;

  return { total: todayTasks.length, overdue };
}

// ---------------------------------------------------------------------------
// Create task
// ---------------------------------------------------------------------------

export async function createTask(data: {
  title: string;
  dueAt?: string;
  contactId?: string;
  propertyId?: string;
}) {
  const userId = await requireUserId();

  if (!data.title.trim()) throw new Error("El titulo es requerido");

  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      title: data.title.trim(),
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
    })
    .returning();

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

// ---------------------------------------------------------------------------
// Toggle task completion
// ---------------------------------------------------------------------------

export async function toggleTask(taskId: string) {
  const userId = await requireUserId();

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    columns: { id: true, completed: true },
  });
  if (!task) throw new Error("Tarea no encontrada");

  const nowCompleted = !task.completed;

  await db
    .update(tasks)
    .set({
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date() : null,
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------------
// Delete task
// ---------------------------------------------------------------------------

export async function deleteTask(taskId: string) {
  const userId = await requireUserId();

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
