import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for Coolify/Traefik.
 * Verifies the app can connect to PostgreSQL.
 * Returns 200 if healthy, 503 if not.
 *
 * Configure in Coolify: Health Check Path = /api/health
 */
export async function GET() {
  const start = Date.now();

  try {
    await db.execute(sql`SELECT 1`);

    return NextResponse.json(
      {
        status: "healthy",
        latency: Date.now() - start,
        uptime: Math.round(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      },
    );
  } catch {
    return NextResponse.json(
      { status: "unhealthy", latency: Date.now() - start },
      { status: 503 },
    );
  }
}
