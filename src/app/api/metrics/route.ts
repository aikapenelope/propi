import { NextResponse } from "next/server";
import { registry } from "@/lib/metrics";

export const dynamic = "force-dynamic";

/**
 * Prometheus metrics scrape endpoint.
 *
 * GET /api/metrics
 *
 * Returns metrics in Prometheus text exposition format.
 * No authentication — designed to be scraped by Prometheus on the private network.
 * Should NOT be exposed to the public internet (use firewall/network rules).
 *
 * This endpoint is excluded from the rate limiter and auth middleware
 * via the isPublicRoute matcher in middleware.ts.
 */
export async function GET() {
  try {
    const metrics = await registry.metrics();
    return new Response(metrics, {
      status: 200,
      headers: {
        "Content-Type": registry.contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to collect metrics" },
      { status: 500 },
    );
  }
}
