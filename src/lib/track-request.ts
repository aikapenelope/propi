import * as Sentry from "@sentry/node";
import { log } from "@/lib/logger";
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
  normalizeRoutePath,
} from "@/lib/metrics";

/**
 * Lightweight request tracking for API routes that already have their own
 * error handling. Unlike `instrumented()` which wraps the entire handler,
 * this provides explicit start/end tracking that integrates with existing
 * try/catch patterns.
 *
 * Usage:
 *   export async function POST(request: Request) {
 *     const tracker = startTracking(request);
 *     try {
 *       // ... existing logic ...
 *       return tracker.end(response);
 *     } catch (err) {
 *       return tracker.error(err);
 *     }
 *   }
 *
 * This records:
 *   - http_requests_total{method, path, status}
 *   - http_request_duration_seconds{method, path}
 *   - Structured JSON log line for every request
 *   - On error: http_errors_total{method, path, error_type} + error log
 */

interface RequestTracker {
  /** Call when the request completes successfully. Pass the Response to record its status. */
  end: (response: Response) => Response;
  /** Call in catch blocks. Logs the error and records metrics. Returns undefined (caller builds response). */
  error: (err: unknown, status?: number) => void;
  /** The generated request ID for correlation. */
  requestId: string;
}

/**
 * Classify an error into a bounded set of categories for metrics.
 */
function classifyError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const msg = error.message.toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("connect") || msg.includes("econnrefused")) return "db";
  if (msg.includes("unauthorized") || msg.includes("forbidden")) return "auth";
  if (msg.includes("not found") || msg.includes("no rows")) return "not_found";
  if (msg.includes("rate limit") || msg.includes("too many")) return "rate_limit";
  if (msg.includes("validation") || msg.includes("invalid") || msg.includes("required"))
    return "validation";
  return "unknown";
}

/**
 * Begin tracking a request. Returns a tracker object with `end()` and `error()` methods.
 */
export function startTracking(request: Request): RequestTracker {
  const start = performance.now();
  const url = new URL(request.url);
  const method = request.method;
  const path = normalizeRoutePath(url.pathname);
  const requestId = Math.random().toString(16).slice(2, 10);

  return {
    requestId,

    end(response: Response): Response {
      const durationMs = Math.round(performance.now() - start);
      const durationSec = durationMs / 1000;
      const status = response.status;

      httpRequestsTotal.inc({ method, path, status: String(status) });
      httpRequestDuration.observe({ method, path }, durationSec);

      log.http.info(
        { method, path, status, duration_ms: durationMs, request_id: requestId },
        "request completed",
      );

      return response;
    },

    error(err: unknown, status = 500): void {
      const durationMs = Math.round(performance.now() - start);
      const durationSec = durationMs / 1000;
      const errorType = classifyError(err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      httpRequestsTotal.inc({ method, path, status: String(status) });
      httpRequestDuration.observe({ method, path }, durationSec);
      httpErrorsTotal.inc({ method, path, error_type: errorType });

      log.http.error(
        {
          method,
          path,
          status,
          duration_ms: durationMs,
          request_id: requestId,
          error: errorMessage,
          error_type: errorType,
          stack: err instanceof Error ? err.stack : undefined,
        },
        "request failed",
      );

      // Report to Bugsink via Sentry SDK (if initialized)
      if (err instanceof Error) {
        Sentry.captureException(err, {
          tags: { method, path, error_type: errorType },
          extra: { request_id: requestId, duration_ms: durationMs },
        });
      }
    },
  };
}
