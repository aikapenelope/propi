import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, tasks, contacts, notifications, activityLog } from "@/server/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Cron job to generate in-app notifications.
 * Runs every hour via Coolify cron.
 *
 * Generates:
 * - Appointment reminders (appointments in the next 24 hours)
 * - Overdue task alerts (tasks past due and not completed)
 * - Birthday reminders (contacts with birthday today, in Venezuela time)
 * - Inactive lead follow-up (no activity in 7+ days)
 *
 * Deduplication strategy
 * ──────────────────────
 * Previous implementation called isDuplicateToday() per notification item,
 * resulting in N individual SELECT queries (one per appointment, task,
 * birthday contact, and inactive lead).  With 100 active users this easily
 * produced 400+ sequential round-trips per cron execution.
 *
 * New approach: a single SELECT loads every notification created today
 * into a Set at the start of the run.  All duplicate checks become O(1)
 * in-memory lookups, regardless of how many users or items are processed.
 *
 * Date/timezone note
 * ──────────────────
 * The DB session timezone is set to America/Caracas in db.ts so all
 * SQL date functions (EXTRACT, TO_CHAR) use Venezuela local time,
 * matching the Node.js TZ=America/Caracas environment variable.
 * todayStart is midnight Venezuela = the correct start-of-day boundary
 * for the dedup window.
 *
 * Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // midnight Venezuela time (Node.js TZ=America/Caracas)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  let appointmentNotifs = 0;
  let taskNotifs = 0;
  let birthdayNotifs = 0;
  let inactiveLeadNotifs = 0;

  try {
    // ── Batch dedup load ────────────────────────────────────────────────────
    //
    // Load all notifications created since midnight Venezuela into a Set.
    // Key format: "<userId>:<title>" — unique enough for same-day dedup.
    // One query replaces N isDuplicateToday() calls later in the loop.
    const todayNotifications = await db
      .select({
        userId: notifications.userId,
        title: notifications.title,
      })
      .from(notifications)
      .where(gte(notifications.createdAt, todayStart));

    const sentToday = new Set(
      todayNotifications.map((n) => `${n.userId}:${n.title}`),
    );

    /** Check dedup without a DB round-trip. */
    function alreadySentToday(userId: string, title: string): boolean {
      return sentToday.has(`${userId}:${title}`);
    }

    /** Mark as sent in the local Set so subsequent duplicate checks within
     *  the same cron run see the notification as already sent. */
    function markSent(userId: string, title: string): void {
      sentToday.add(`${userId}:${title}`);
    }

    // ── Appointment reminders (next 24 hours) ───────────────────────────────
    const upcomingAppointments = await db
      .select({
        id: appointments.id,
        title: appointments.title,
        startsAt: appointments.startsAt,
        userId: appointments.userId,
      })
      .from(appointments)
      .where(
        and(
          gte(appointments.startsAt, now),
          lte(appointments.startsAt, tomorrow),
        ),
      );

    for (const appt of upcomingAppointments) {
      const title = `Cita: ${appt.title}`;
      if (alreadySentToday(appt.userId, title)) continue;

      const hours = Math.round(
        (new Date(appt.startsAt).getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      await db.insert(notifications).values({
        userId: appt.userId,
        type: "appointment_reminder",
        title,
        message: `En ${hours <= 1 ? "menos de 1 hora" : `${hours} horas`}`,
        link: "/calendar",
      });
      markSent(appt.userId, title);
      appointmentNotifs++;
    }

    // ── Overdue tasks ───────────────────────────────────────────────────────
    const overdueTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueAt: tasks.dueAt,
        userId: tasks.userId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.completed, false),
          lte(tasks.dueAt, now),
        ),
      );

    for (const task of overdueTasks) {
      const title = `Tarea vencida: ${task.title}`;
      if (alreadySentToday(task.userId, title)) continue;

      await db.insert(notifications).values({
        userId: task.userId,
        type: "task_overdue",
        title,
        message: "Esta tarea ya paso su fecha limite.",
        link: "/tasks",
      });
      markSent(task.userId, title);
      taskNotifs++;
    }

    // ── Birthday reminders ──────────────────────────────────────────────────
    //
    // EXTRACT uses the DB session timezone (America/Caracas, set in db.ts).
    // This matches the Venezuela calendar day that the user intended when
    // they entered the birthday date in the form.
    const todayMonth = now.getMonth() + 1; // Venezuela local month
    const todayDay = now.getDate();         // Venezuela local day

    const birthdayContacts = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        userId: contacts.userId,
      })
      .from(contacts)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${contacts.birthDate}) = ${todayMonth}`,
          sql`EXTRACT(DAY FROM ${contacts.birthDate}) = ${todayDay}`,
        ),
      );

    for (const contact of birthdayContacts) {
      const title = `Cumpleanos: ${contact.name}`;
      if (alreadySentToday(contact.userId, title)) continue;

      await db.insert(notifications).values({
        userId: contact.userId,
        type: "birthday",
        title,
        message: "Hoy es su cumpleanos. Enviale un mensaje.",
        link: `/contacts/${contact.id}`,
      });
      markSent(contact.userId, title);
      birthdayNotifs++;
    }

    // ── Inactive leads (no activity in 7+ days) ────────────────────────────
    const inactivityCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Correlated subquery fetches the last activity date per contact without
    // a separate round-trip or a JOIN that would inflate row counts.
    const activeLeads = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        userId: contacts.userId,
        lastActivity: sql<Date | null>`(
          SELECT MAX(${activityLog.createdAt})
          FROM ${activityLog}
          WHERE ${activityLog.contactId} = ${contacts.id}
        )`,
      })
      .from(contacts)
      .where(
        and(
          sql`${contacts.leadStatus} NOT IN ('closed', 'lost')`,
          // Only check contacts created more than 7 days ago
          lte(contacts.createdAt, inactivityCutoff),
        ),
      );

    for (const lead of activeLeads) {
      // Skip if there's recent activity
      if (lead.lastActivity && new Date(lead.lastActivity) > inactivityCutoff) {
        continue;
      }

      const title = `Seguimiento: ${lead.name}`;
      if (alreadySentToday(lead.userId, title)) continue;

      const daysSince = lead.lastActivity
        ? Math.floor(
            (now.getTime() - new Date(lead.lastActivity).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : Math.floor(
            (now.getTime() - inactivityCutoff.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 7;

      await db.insert(notifications).values({
        userId: lead.userId,
        type: "system",
        title,
        message: `Sin actividad hace ${daysSince} dias. Considera hacer seguimiento.`,
        link: `/contacts/${lead.id}`,
      });
      markSent(lead.userId, title);
      inactiveLeadNotifs++;
    }

    return NextResponse.json({
      success: true,
      generated: {
        appointments: appointmentNotifs,
        tasks: taskNotifs,
        birthdays: birthdayNotifs,
        inactiveLeads: inactiveLeadNotifs,
      },
      timestamp: now.toISOString(),
    });
  } catch (err) {
    log.cron.error(
      { error: err instanceof Error ? err.message : String(err) },
      "notification generation failed",
    );
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
