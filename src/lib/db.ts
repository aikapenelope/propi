import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/server/schema";

/**
 * Database connection for Propi.
 *
 * Uses PgBouncer (port 6432) for connection pooling in production.
 * Falls back to direct Postgres (port 5432) for migrations.
 *
 * Lazy-initialized to avoid crashing during Next.js build time
 * when DATABASE_URL is not available (e.g. Vercel build step).
 *
 * Required env var: DATABASE_URL
 * Example: postgresql://platform:<pw>@10.0.1.20:6432/propi
 */

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  _db = drizzle(client, { schema });
  return _db;
}

/**
 * Convenience export for use in server actions.
 * Uses a getter so the connection is only created when actually needed at runtime.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
