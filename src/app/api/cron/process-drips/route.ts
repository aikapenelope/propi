import { NextResponse } from "next/server";
import {
  getPendingDripEmails,
  advanceEnrollment,
} from "@/server/actions/drip-campaigns";
import type { DripStep } from "@/server/actions/drip-campaigns";
import { sendEmail } from "@/lib/mailer";
import { getUserResendKey } from "@/lib/resend-key";

export const dynamic = "force-dynamic";

/**
 * Cron job to process pending drip campaign emails.
 * Finds enrollments where nextRunAt <= now, sends the email, advances to next step.
 *
 * Schedule: every hour via Coolify cron
 * curl -H "Authorization: Bearer $CRON_SECRET" https://propi.aikalabs.cc/api/cron/process-drips
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pending = await getPendingDripEmails();
    let sent = 0;
    let failed = 0;

    for (const enrollment of pending) {
      const steps = enrollment.sequence.steps as DripStep[];
      const step = steps[enrollment.currentStep];

      if (!step || !enrollment.contact.email) {
        await advanceEnrollment(enrollment.id, steps.length);
        continue;
      }

      try {
        const userKey = await getUserResendKey(enrollment.userId);
        await sendEmail({
          to: enrollment.contact.email,
          subject: step.subject,
          html: step.body.replace(/\n/g, "<br>"),
          apiKey: userKey || undefined,
        });
        sent++;
      } catch (err) {
        console.error(`Drip email failed for ${enrollment.contact.email}:`, err);
        failed++;
      }

      await advanceEnrollment(enrollment.id, steps.length);
    }

    return NextResponse.json({
      success: true,
      processed: pending.length,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Drip processor error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
