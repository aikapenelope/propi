import { NextResponse } from "next/server";
import { cleanupOldMessages } from "@/server/actions/messaging";

export const dynamic = "force-dynamic";

/**
 * Cron job to delete messages older than 90 days.
 * Prevents the messages table from growing indefinitely.
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
    const result = await cleanupOldMessages();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}
