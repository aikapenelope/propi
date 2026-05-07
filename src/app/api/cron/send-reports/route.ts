import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledReports } from "@/server/schema";
import { eq, and, lte } from "drizzle-orm";

/**
 * POST /api/cron/send-reports
 *
 * Sends scheduled reports to recipients via email.
 * Should be called periodically (e.g., every hour) by a cron job.
 *
 * Finds all active scheduled reports where nextRunAt <= now,
 * generates the report data, sends it via Resend, and updates nextRunAt.
 *
 * Protected by CRON_SECRET header.
 */
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find reports due to be sent
  const dueReports = await db.query.scheduledReports.findMany({
    where: and(
      eq(scheduledReports.active, true),
      lte(scheduledReports.nextRunAt, now),
    ),
  });

  if (dueReports.length === 0) {
    return NextResponse.json({ sent: 0, message: "No reports due" });
  }

  let sent = 0;
  const errors: { id: string; error: string }[] = [];

  for (const report of dueReports) {
    try {
      // Generate report data for the appropriate period
      const period = getReportPeriod(report.frequency);

      // Dynamic import to avoid circular deps
      const { getReportDataInternal } = await import(
        "@/server/actions/reports-internal"
      );
      const reportData = await getReportDataInternal(report.userId, period);

      // Send email
      await sendReportEmail(
        report.recipientEmail,
        reportData,
        report.frequency,
      );

      // Update lastSentAt and calculate next run
      const nextRunAt = calculateNextRun(report.frequency);
      await db
        .update(scheduledReports)
        .set({ lastSentAt: now, nextRunAt })
        .where(eq(scheduledReports.id, report.id));

      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push({ id: report.id, error: message });
    }
  }

  return NextResponse.json({ sent, errors, total: dueReports.length });
}

// Also support GET for simple cron triggers (curl-based)
export async function GET(request: Request) {
  return POST(request);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getReportPeriod(frequency: string): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);

  if (frequency === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startDate: start.toISOString().slice(0, 10), endDate };
  }

  // Monthly: first of last month to last day of last month
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function calculateNextRun(frequency: string): Date {
  const now = new Date();

  if (frequency === "weekly") {
    // Next Monday at 8am
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(8, 0, 0, 0);
    return next;
  }

  // Monthly: first of next month at 8am
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
}

interface ReportEmailData {
  transactions: {
    closed: number;
    totalVolume: number;
    totalCommission: number;
  };
  pipeline: { newLeads: number; conversionRate: number };
  activity: {
    appointmentsCreated: number;
    appointmentsCompleted: number;
    contactsCreated: number;
  };
  period: { startDate: string; endDate: string };
}

async function sendReportEmail(
  to: string,
  data: ReportEmailData,
  frequency: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const from = process.env.MAIL_FROM || "Propi <noreply@propi.aikalabs.cc>";
  const periodLabel = frequency === "weekly" ? "Semanal" : "Mensual";
  const subject = `Reporte ${periodLabel} - Propi (${data.period.startDate} a ${data.period.endDate})`;

  const fmt = (n: number) =>
    new Intl.NumberFormat("es", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #1a1a1a; margin-bottom: 4px;">Reporte ${periodLabel}</h1>
      <p style="color: #666; font-size: 14px; margin-bottom: 24px;">${data.period.startDate} a ${data.period.endDate}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="background: #f8f8f8;">
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Transacciones Cerradas</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right;">${data.transactions.closed}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Volumen Total</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right;">${fmt(data.transactions.totalVolume)}</td>
        </tr>
        <tr style="background: #f8f8f8;">
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Comisiones</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right; color: #059669;">${fmt(data.transactions.totalCommission)}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Leads Nuevos</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right;">${data.pipeline.newLeads}</td>
        </tr>
        <tr style="background: #f8f8f8;">
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Conversion</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right;">${data.pipeline.conversionRate}%</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Citas Creadas</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right;">${data.activity.appointmentsCreated}</td>
        </tr>
        <tr style="background: #f8f8f8;">
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Citas Completadas</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right;">${data.activity.appointmentsCompleted}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #eee; font-weight: 600;">Contactos Nuevos</td>
          <td style="padding: 12px; border: 1px solid #eee; text-align: right;">${data.activity.contactsCreated}</td>
        </tr>
      </table>
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        Generado automaticamente por Propi CRM
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}
