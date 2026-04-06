import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialAccounts } from "@/server/schema";
import { eq } from "drizzle-orm";
import { marketSyncQueue } from "@/lib/queue";

export const dynamic = "force-dynamic";

/**
 * Daily cron job to sync MercadoLibre listings.
 * Multi-tenant: enqueues a BullMQ job per user with ML connected.
 * The actual sync runs in a separate worker process (market-sync-worker.ts).
 *
 * This route returns immediately after enqueuing (~50ms vs ~40min before).
 *
 * Protected by CRON_SECRET header.
 * Call: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/sync-market
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

  // Get all users with ML connected
  const mlAccounts = await db.query.socialAccounts.findMany({
    where: eq(socialAccounts.platform, "mercadolibre"),
  });

  if (mlAccounts.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No MercadoLibre accounts connected",
      jobsEnqueued: 0,
    });
  }

  const enqueued: { userId: string; jobId: string }[] = [];
  const errors: { userId: string; error: string }[] = [];

  for (const account of mlAccounts) {
    try {
      // Enqueue job with userId only (worker fetches token at processing time)
      const job = await marketSyncQueue.add(
        "sync",
        { userId: account.userId },
        { jobId: `sync-${account.userId}-${Date.now()}` },
      );

      enqueued.push({ userId: account.userId, jobId: job.id! });
    } catch (err) {
      errors.push({
        userId: account.userId,
        error: err instanceof Error ? err.message : "Token error",
      });
    }
  }

  return NextResponse.json({
    success: true,
    jobsEnqueued: enqueued.length,
    enqueued,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
