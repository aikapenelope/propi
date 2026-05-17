import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/server/schema";

/**
 * Database connection for Propi.
 *
 * - Production: DATABASE_URL is required. Fails fast at startup if missing.
 * - Build time: Returns a no-op proxy (DATABASE_URL is intentionally absent
 *   during `next build`). The proxy throws only if you actually try to query,
 *   which never happens during static generation.
 */

const connectionString = process.env.DATABASE_URL;

// Fail fast in production if DATABASE_URL is missing.
if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error(
    "DATABASE_URL is not set. The application cannot start without a database connection.",
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
