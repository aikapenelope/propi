import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET } from "@/lib/s3";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for Coolify/Traefik.
 * Verifies connectivity to PostgreSQL, Redis, and MinIO.
 * Returns 200 if all services are reachable, 503 if any fail.
 *
 * Configure in Coolify: Health Check Path = /api/health
 */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, "ok" | "fail"> = {};

  // PostgreSQL
  try {
    await db.execute(sql`SELECT 1`);
    checks.postgres = "ok";
  } catch {
    checks.postgres = "fail";
  }

  // Redis (only if configured)
  if (process.env.REDIS_URL) {
    try {
      const IORedis = (await import("ioredis")).default;
      const redis = new IORedis(process.env.REDIS_URL, {
        connectTimeout: 3_000,
        commandTimeout: 3_000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
      });
      await redis.ping();
      await redis.quit();
      checks.redis = "ok";
    } catch {
      checks.redis = "fail";
    }
  }

  // MinIO / S3
  try {
    await s3.send(new HeadBucketCommand({ Bucket: MEDIA_BUCKET }));
    checks.minio = "ok";
  } catch {
    checks.minio = "fail";
  }

  const allHealthy = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      checks,
      latency: Date.now() - start,
      uptime: Math.round(process.uptime()),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      timestamp: new Date().toISOString(),
    },
    {
      status: allHealthy ? 200 : 503,
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    },
  );
}
