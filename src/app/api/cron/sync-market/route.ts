import { NextResponse } from "next/server";
import { startTracking } from "@/lib/track-request";

export const dynamic = "force-dynamic";

/**
 * Daily cron job to sync MercadoLibre listings.
 * Enqueues a single global sync job (uses platform service token).
 * The actual sync runs in a separate worker process (market-sync-worker.ts).
 *
 * Protected by CRON_SECRET header.
 * Call: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/sync-market
 */
export async function GET(request: Request) {
  const tracker = startTracking(request);
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return tracker.end(
      NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 },
      ),
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return tracker.end(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
  }

  try {
    // Dynamic import to avoid loading Redis/BullMQ at build time
    const { marketSyncQueue } = await import("@/lib/queue");
    const job = await marketSyncQueue.add(
      "sync",
      { type: "global" },
      { jobId: `sync-global-${Date.now()}` },
    );

    return tracker.end(
      NextResponse.json({
        success: true,
        jobId: job.id,
        message: "Market sync job enqueued",
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (err) {
    tracker.error(err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to enqueue job",
      },
      { status: 500 },
    );
  }
}
