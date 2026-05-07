import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledReports } from "@/server/schema";
import { eq, and, lte } from "drizzle-orm";
import { buildReport } from "@/server/actions/reports";

/**
 * GET/POST /api/cron/send-reports
 *
 * Sends scheduled reports to recipients via Resend.
 * Protected by CRON_SECRET. Call periodically (e.g., every hour).
 *
 * curl -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/send-reports
 */

async function handler(request: Request) {
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
      const period = getPeriodForFrequency(report.frequency);
      const data = await buildReport(report.userId, period);
      await sendReportEmail(report.recipientEmail, data, report.frequency);

      // Update timestamps
      const nextRunAt = getNextRun(report.frequency);
      await db
        .update(scheduledReports)
        .set({ lastSentAt: now, nextRunAt })
        .where(eq(scheduledReports.id, report.id));

      sent++;
    } catch (err) {
      errors.push({
        id: report.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ sent, errors, total: dueReports.length });
}

export const GET = handler;
export const POST = handler;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPeriodForFrequency(frequency: string) {
  const now = new Date();
  if (frequency === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
    };
  }
  // Monthly: previous full month
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function getNextRun(frequency: string): Date {
  const now = new Date();
  if (frequency === "weekly") {
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(8, 0, 0, 0);
    return next;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
}

interface ReportEmailData {
  transactions: { closed: number; totalVolume: number; totalCommission: number };
  pipeline: { newLeads: number; conversionRate: number };
  activity: { appointmentsCreated: number; appointmentsCompleted: number; contactsCreated: number };
  period: { startDate: string; endDate: string };
}

async function sendReportEmail(to: string, data: ReportEmailData, frequency: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const from = process.env.MAIL_FROM || "Propi <noreply@propi.aikalabs.cc>";
  const label = frequency === "weekly" ? "Semanal" : "Mensual";
  const subject = `Reporte ${label} — Propi (${data.period.startDate} a ${data.period.endDate})`;

  const fmtUsd = (n: number) =>
    new Intl.NumberFormat("es", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;color:#1a1a1a;margin-bottom:4px">Reporte ${label}</h1>
  <p style="color:#666;font-size:14px;margin-bottom:24px">${data.period.startDate} a ${data.period.endDate}</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr style="background:#f8f8f8"><td style="padding:12px;border:1px solid #eee;font-weight:600">Transacciones</td><td style="padding:12px;border:1px solid #eee;text-align:right">${data.transactions.closed}</td></tr>
    <tr><td style="padding:12px;border:1px solid #eee;font-weight:600">Volumen</td><td style="padding:12px;border:1px solid #eee;text-align:right">${fmtUsd(data.transactions.totalVolume)}</td></tr>
    <tr style="background:#f8f8f8"><td style="padding:12px;border:1px solid #eee;font-weight:600">Comisiones</td><td style="padding:12px;border:1px solid #eee;text-align:right;color:#059669">${fmtUsd(data.transactions.totalCommission)}</td></tr>
    <tr><td style="padding:12px;border:1px solid #eee;font-weight:600">Leads Nuevos</td><td style="padding:12px;border:1px solid #eee;text-align:right">${data.pipeline.newLeads}</td></tr>
    <tr style="background:#f8f8f8"><td style="padding:12px;border:1px solid #eee;font-weight:600">Conversion</td><td style="padding:12px;border:1px solid #eee;text-align:right">${data.pipeline.conversionRate}%</td></tr>
    <tr><td style="padding:12px;border:1px solid #eee;font-weight:600">Citas</td><td style="padding:12px;border:1px solid #eee;text-align:right">${data.activity.appointmentsCreated}</td></tr>
    <tr style="background:#f8f8f8"><td style="padding:12px;border:1px solid #eee;font-weight:600">Contactos Nuevos</td><td style="padding:12px;border:1px solid #eee;text-align:right">${data.activity.contactsCreated}</td></tr>
  </table>
  <p style="color:#999;font-size:12px;text-align:center">Generado por Propi CRM</p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${err}`);
  }
}
