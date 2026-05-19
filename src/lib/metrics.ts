import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";

/**
 * Prometheus metrics for Propi CRM.
 *
 * Provides:
 * - Default Node.js metrics (CPU, RAM, event loop, GC)
 * - HTTP request counter (method, path, status)
 * - HTTP request duration histogram (method, path)
 * - HTTP business error counter (method, path, error_type)
 *
 * The /api/metrics endpoint exposes these for Prometheus scraping.
 * Labels use route PATTERNS (not actual URLs) to prevent cardinality explosion.
 *
 * Reference: https://prometheus.io/docs/practices/naming/
 */

// ---------------------------------------------------------------------------
// Global registry (singleton)
// ---------------------------------------------------------------------------

export const registry = new Registry();

// Collect default Node.js metrics: CPU, memory, event loop lag, GC, etc.
collectDefaultMetrics({ register: registry });

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

/**
 * Total HTTP requests processed.
 * Labels:
 * - method: GET, POST, PUT, DELETE, PATCH
 * - path: route pattern (e.g. "/api/upload", "/properties/[id]")
 * - status: HTTP status code as string (e.g. "200", "404", "500")
 */
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"] as const,
  registers: [registry],
});

/**
 * HTTP request duration in seconds.
 * Labels:
 * - method: GET, POST, PUT, DELETE, PATCH
 * - path: route pattern (e.g. "/api/upload", "/properties/[id]")
 *
 * Buckets cover the range from fast API calls (10ms) to slow operations (10s).
 */
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path"] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

/**
 * Business errors that are handled gracefully (not 500s).
 * These are errors caught internally that return user-friendly messages
 * but should still be tracked for operational awareness.
 *
 * Labels:
 * - method: GET, POST, PUT, DELETE, PATCH
 * - path: route pattern
 * - error_type: validation, db, timeout, auth, not_found, rate_limit, unknown
 */
export const httpErrorsTotal = new Counter({
  name: "http_errors_total",
  help: "Total number of handled business errors (non-500)",
  labelNames: ["method", "path", "error_type"] as const,
  registers: [registry],
});

// ---------------------------------------------------------------------------
// Route pattern normalization
// ---------------------------------------------------------------------------

/**
 * Convert a real URL path to a route pattern to prevent cardinality explosion.
 *
 * Examples:
 *   /properties/550e8400-e29b-41d4-a716-446655440000 -> /properties/[id]
 *   /api/images/user_123/properties/abc/photo.jpg -> /api/images/[...key]
 *   /contacts/550e8400-e29b-41d4-a716-446655440000/edit -> /contacts/[id]/edit
 *   /p/550e8400-e29b-41d4-a716-446655440000 -> /p/[id]
 */
export function normalizeRoutePath(pathname: string): string {
  // UUID pattern (v4)
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

  // /api/images/... catch-all route
  if (pathname.startsWith("/api/images/")) {
    return "/api/images/[...key]";
  }

  // Replace UUIDs with [id]
  let normalized = pathname.replace(uuidPattern, "[id]");

  // Replace Clerk sign-in/sign-up catch-all segments
  normalized = normalized.replace(/\/(sign-in|sign-up)\/.*/, "/$1/[...]");

  return normalized;
}
