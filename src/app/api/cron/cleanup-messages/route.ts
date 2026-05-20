import { NextResponse } from "next/server";
import { cleanupOldMessages } from "@/server/actions/messaging";
import { db } from "@/lib/db";
import { notifications } from "@/server/schema";
import { and, eq, lt } from "drizzle-orm";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Cron job to clean up stale data:
 * - Messages older than 90 days
 * - Read notifications older than 30 days
 *
 * Protected by CRON_SECRET header.
 * Call: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/cleanup-messages
 * Schedule: weekly (every Sunday at 3am)
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

  try {
    const messageResult = await cleanupOldMessages();

    // Clean up read notifications older than 30 days
    const notifCutoff = new Date();
    notifCutoff.setDate(notifCutoff.getDate() - 30);
    const deletedNotifs = await db
      .delete(notifications)
      .where(
        and(eq(notifications.read, true), lt(notifications.createdAt, notifCutoff)),
      )
      .returning({ id: notifications.id });

    return NextResponse.json({
      success: true,
      ...messageResult,
      notificationsDeleted: deletedNotifs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.cron.error({ error: err instanceof Error ? err.message : String(err) }, "cleanup job failed");
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}
