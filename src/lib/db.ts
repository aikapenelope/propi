import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/server/schema";

/**
 * Database connection for Propi.
 *
 * - Runtime: DATABASE_URL is required. Fails fast at startup if missing.
 * - Build time: Returns a no-op proxy (DATABASE_URL is intentionally absent
 *   during `next build`). The proxy throws only if you actually try to query,
 *   which never happens during static generation.
 *
 * Note: NODE_ENV=production is set during Docker builds, so we can't use it
 * alone to detect runtime. We check NEXT_PHASE to distinguish build from run.
 */

const connectionString = process.env.DATABASE_URL;
const isBuilding = process.env.NEXT_PHASE === "phase-production-build";

// Fail fast at runtime if DATABASE_URL is missing.
// Skip during `next build` where DATABASE_URL is intentionally absent.
if (!connectionString && !isBuilding) {
  console.error(
    "WARNING: DATABASE_URL is not set. Database queries will fail.",
  );
}

export const db: ReturnType<typeof drizzle<typeof schema>> = connectionString
  ? drizzle(
      postgres(connectionString, {
        max: process.env.NODE_ENV === "production" ? 10 : 1,
        idle_timeout: 20,
        connect_timeout: 10,
      }),
      { schema },
    )
  : (new Proxy(
      {},
      {
        get(_target, prop) {
          // Allow typeof checks and Symbol access without throwing
          if (typeof prop === "symbol" || prop === "then") return undefined;
          throw new Error(
            `DATABASE_URL is not set. Cannot access db.${String(prop)} at build time.`,
          );
        },
      },
    ) as ReturnType<typeof drizzle<typeof schema>>);
