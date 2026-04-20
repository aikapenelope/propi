import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, tasks, contacts, notifications } from "@/server/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Cron job to generate in-app notifications.
 * Runs every hour via Coolify cron.
 *
 * Generates:
 * - Appointment reminders (appointments in the next 24 hours)
 * - Overdue task alerts (tasks past due and not completed)
 * - Birthday reminders (contacts with birthday today)
 *
 * Deduplication: checks if a notification with the same title + userId
 * already exists today before inserting.
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
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  let appointmentNotifs = 0;
  let taskNotifs = 0;
  let birthdayNotifs = 0;

  try {
    // --- Appointment reminders (next 24 hours) ---
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
      const exists = await isDuplicateToday(appt.userId, `Cita: ${appt.title}`, todayStart);
      if (exists) continue;

      const hours = Math.round(
        (new Date(appt.startsAt).getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      await db.insert(notifications).values({
        userId: appt.userId,
        type: "appointment_reminder",
        title: `Cita: ${appt.title}`,
        message: `En ${hours <= 1 ? "menos de 1 hora" : `${hours} horas`}`,
        link: "/calendar",
      });
      appointmentNotifs++;
    }

    // --- Overdue tasks ---
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
      const exists = await isDuplicateToday(task.userId, `Tarea vencida: ${task.title}`, todayStart);
      if (exists) continue;

      await db.insert(notifications).values({
        userId: task.userId,
        type: "task_overdue",
        title: `Tarea vencida: ${task.title}`,
        message: "Esta tarea ya paso su fecha limite.",
        link: "/tasks",
      });
      taskNotifs++;
    }

    // --- Birthday reminders ---
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

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
      const exists = await isDuplicateToday(
        contact.userId,
        `Cumpleanos: ${contact.name}`,
        todayStart,
      );
      if (exists) continue;

      await db.insert(notifications).values({
        userId: contact.userId,
        type: "birthday",
        title: `Cumpleanos: ${contact.name}`,
        message: "Hoy es su cumpleanos. Enviale un mensaje.",
        link: `/contacts/${contact.id}`,
      });
      birthdayNotifs++;
    }

    return NextResponse.json({
      success: true,
      generated: {
        appointments: appointmentNotifs,
        tasks: taskNotifs,
        birthdays: birthdayNotifs,
      },
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("Notification generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

/** Check if a notification with the same title + userId was already created today. */
async function isDuplicateToday(
  userId: string,
  title: string,
  todayStart: Date,
): Promise<boolean> {
  const existing = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.title, title),
      gte(notifications.createdAt, todayStart),
    ),
    columns: { id: true },
  });
  return !!existing;
}
