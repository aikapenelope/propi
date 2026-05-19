import { NextResponse } from "next/server";
import { log } from "@/lib/logger";
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  normalizeRoutePath,
} from "@/lib/metrics";

/**
 * Production-grade instrumentation wrapper for Next.js API routes.
 *
 * Combines three observability signals in a single decorator:
 *   1. Structured JSON logging (pino → stdout → Alloy → Loki → Grafana)
 *   2. Prometheus metrics (prom-client → /api/metrics → Alloy → Prometheus → Grafana)
 *   3. Error classification for business error tracking
 *
 * Usage:
 *   // src/app/api/orders/route.ts
 *   import { instrumented } from "@/lib/instrumented";
 *
 *   export const GET = instrumented(async (req) => {
 *     const orders = await db.query.orders.findMany();
 *     return NextResponse.json({ orders });
 *   });
 *
 * What it does on every request:
 *   - Measures duration (high-resolution timer)
 *   - Increments http_requests_total{method, path, status}
 *   - Observes http_request_duration_seconds{method, path}
 *   - Logs JSON: { method, path, status, duration_ms, request_id }
 *   - On error: classifies error type, increments http_errors_total, logs with stack
 *
 * Path normalization:
 *   UUIDs are replaced with [id] to prevent Prometheus cardinality explosion.
 *   Example: /api/properties/550e8400-... → /api/properties/[id]
 *
 * Reference: https://github.com/aikapenelope/Obs/blob/main/docs/INTEGRATION-GUIDE.md
 */

type RouteHandler = (
  req: Request,
  context?: { params?: Promise<Record<string, string | string[]>> },
) => Promise<Response>;

/**
 * Classify an error into a category for the http_errors_total metric.
 * Keeps cardinality bounded (max ~7 distinct values).
 */
function classifyError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";

  const msg = error.message.toLowerCase();

  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("connect") || msg.includes("econnrefused")) return "db";
  if (msg.includes("unauthorized") || msg.includes("forbidden")) return "auth";
  if (msg.includes("not found") || msg.includes("no rows")) return "not_found";
  if (msg.includes("rate limit") || msg.includes("too many")) return "rate_limit";
  if (
    msg.includes("validation") ||
    msg.includes("invalid") ||
    msg.includes("required")
  )
    return "validation";

  return "unknown";
}

/**
 * Generate a short request ID for correlation across logs.
 * Format: 8 hex chars (enough for per-request uniqueness within a container).
 */
function generateRequestId(): string {
  return Math.random().toString(16).slice(2, 10);
}

/**
 * Wrap a Next.js API route handler with full observability instrumentation.
 *
 * @param handler - The route handler function
 * @returns Instrumented handler that logs, measures, and tracks errors
 */
export function instrumented(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const start = performance.now();
    const url = new URL(req.url);
    const method = req.method;
    const path = normalizeRoutePath(url.pathname);
    const requestId = generateRequestId();

    try {
      const res = await handler(req, context);
      const durationMs = Math.round(performance.now() - start);
      const durationSec = durationMs / 1000;
      const status = res.status;

      // Prometheus metrics
      httpRequestsTotal.inc({ method, path, status: String(status) });
      httpRequestDuration.observe({ method, path }, durationSec);

      // Structured log (JSON → stdout → Alloy → Loki)
      log.http.info(
        {
          method,
          path,
          status,
          duration_ms: durationMs,
          request_id: requestId,
        },
        "request completed",
      );

      return res;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);
      const durationSec = durationMs / 1000;
      const errorType = classifyError(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Prometheus metrics — record the 500 and the error type
      httpRequestsTotal.inc({ method, path, status: "500" });
      httpRequestDuration.observe({ method, path }, durationSec);
      httpErrorsTotal.inc({ method, path, error_type: errorType });

      // Structured error log with stack trace
      log.http.error(
        {
          method,
          path,
          status: 500,
          duration_ms: durationMs,
          request_id: requestId,
          error: errorMessage,
          error_type: errorType,
          stack: error instanceof Error ? error.stack : undefined,
        },
        "request failed",
      );

      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  };
}
