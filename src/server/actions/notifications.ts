"use server";

import { db } from "@/lib/db";
import { notifications } from "@/server/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get recent notifications for the current user (latest 30). */
export async function getNotifications() {
  const userId = await requireUserId();

  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit: 30,
  });
}

/** Get unread notification count for the current user. */
export async function getUnreadNotificationCount() {
  const userId = await requireUserId();

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.read, false)),
    );

  return result?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Mark a single notification as read. */
export async function markNotificationRead(notificationId: string) {
  const userId = await requireUserId();

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    );

  revalidatePath("/");
}

/** Mark all notifications as read for the current user. */
export async function markAllNotificationsRead() {
  const userId = await requireUserId();

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.read, false)),
    );

  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Create notifications (called from cron or server-side logic, no auth)
// ---------------------------------------------------------------------------

/** Insert a notification for a specific user. */
export async function createNotification(data: {
  userId: string;
  type: "appointment_reminder" | "task_overdue" | "birthday" | "campaign_complete" | "system";
  title: string;
  message?: string;
  link?: string;
}) {
  await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message || null,
    link: data.link || null,
  });
}
