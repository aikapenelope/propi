import pino from "pino";

/**
 * Structured JSON logger for Propi CRM.
 *
 * Outputs one JSON object per line to stdout — the format expected by
 * Docker → Alloy → Loki pipeline. Grafana can then filter/query by any field.
 *
 * Configuration:
 *   LOG_LEVEL env var controls verbosity (default: "info" in production, "debug" in dev).
 *
 * Fields emitted on every log line:
 *   - level: "debug" | "info" | "warn" | "error" | "fatal"
 *   - ts: ISO 8601 timestamp (indexed by Loki)
 *   - msg: human-readable message
 *   - pid: process ID (useful for multi-instance debugging)
 *   - hostname: container hostname (matches Alloy's static label)
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ method: "GET", path: "/api/health", status: 200, duration_ms: 12 }, "request completed");
 *   logger.error({ error: err.message, stack: err.stack }, "unhandled error");
 *
 * Reference: https://github.com/aikapenelope/Obs/blob/main/docs/INTEGRATION-GUIDE.md
 */

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

  // Rename pino's default "level" number to a human-readable string.
  formatters: {
    level: (label) => ({ level: label }),
  },

  // ISO 8601 timestamp as "ts" field — matches the INTEGRATION-GUIDE spec.
  timestamp: () => `,"ts":"${new Date().toISOString()}"`,

  // Redact sensitive fields that might accidentally appear in log context.
  redact: {
    paths: [
      "authorization",
      "cookie",
      "password",
      "secret",
      "token",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
});

/**
 * Child loggers for specific subsystems.
 * Each adds a "component" field to every log line for easy filtering in Grafana.
 *
 * Example Loki query: {service_name=~".*propi.*"} | json | component = "db"
 */
export const log = {
  /** Database operations (queries, migrations, connection issues) */
  db: logger.child({ component: "db" }),
  /** HTTP request lifecycle */
  http: logger.child({ component: "http" }),
  /** Background jobs (BullMQ workers) */
  worker: logger.child({ component: "worker" }),
  /** Authentication and authorization */
  auth: logger.child({ component: "auth" }),
  /** External API calls (MercadoLibre, Meta, Groq, Resend) */
  external: logger.child({ component: "external" }),
  /** Cron jobs */
  cron: logger.child({ component: "cron" }),
};
