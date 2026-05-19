/**
 * Next.js Instrumentation Hook — Server-side initialization.
 *
 * This file is loaded ONCE when the Node.js server starts (not on Edge Runtime).
 * It initializes:
 *   - Sentry SDK (pointing to self-hosted Bugsink on the Obs Plane)
 *   - Startup logging
 *
 * The Sentry SDK captures:
 *   - Unhandled exceptions (uncaughtException, unhandledRejection)
 *   - Errors thrown in API routes and server components
 *   - Performance traces (sampled at 10%)
 *
 * Configuration:
 *   BUGSINK_DSN — Sentry-compatible DSN pointing to Bugsink
 *   Example: http://94f57ecb-20c4-43f0-b0a9-f1d22e77d4fb@10.0.1.50:8000/5
 *
 * Reference: https://github.com/aikapenelope/Obs/blob/main/docs/INTEGRATION-GUIDE.md
 */

export async function register() {
  // Only initialize on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");

    // Initialize Sentry/Bugsink if DSN is configured
    if (process.env.BUGSINK_DSN) {
      const Sentry = await import("@sentry/node");

      Sentry.init({
        dsn: process.env.BUGSINK_DSN,
        environment: process.env.NODE_ENV || "production",

        // Sample 10% of requests for performance traces.
        // Bugsink is self-hosted with limited storage — keep sampling low.
        tracesSampleRate: 0.1,

        // Only send errors in production (avoid noise during development)
        enabled: process.env.NODE_ENV === "production",

        // Strip PII from error reports before sending to Bugsink
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
            delete event.request.headers["x-forwarded-for"];
          }
          // Remove user IP addresses
          if (event.user) {
            delete event.user.ip_address;
          }
          return event;
        },

        // Ignore common non-actionable errors
        ignoreErrors: [
          // Network errors from client disconnects
          "ECONNRESET",
          "EPIPE",
          "ECONNABORTED",
          // Next.js internal navigation
          "NEXT_NOT_FOUND",
          "NEXT_REDIRECT",
        ],
      });

      logger.info(
        { bugsink_project: 5 },
        "Sentry/Bugsink initialized for error tracking",
      );
    } else {
      logger.warn(
        "BUGSINK_DSN not set — error tracking disabled. Set it in Coolify env vars.",
      );
    }

    logger.info(
      {
        node_version: process.version,
        env: process.env.NODE_ENV,
        pid: process.pid,
      },
      "Propi server started",
    );
  }
}
