import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/server/schema";

/**
 * Database connection for Propi.
 *
 * Returns a real Drizzle client if DATABASE_URL is set,
 * or a no-op proxy if not (build time in Docker).
 * The proxy throws only if you actually try to query,
 * which never happens during static generation.
 *
 * Note: NODE_ENV=production is set during Docker builds,
 * so we cannot use it to distinguish build from runtime.
 * The proxy pattern handles both cases correctly.
 *
 * Timezone alignment
 * ──────────────────
 * The app container runs with TZ=America/Caracas so all new Date() calls
 * return Venezuela local time.  Without the `connection.TimeZone` option
 * below, PostgreSQL's session timezone defaults to UTC, causing a 4-hour
 * drift for any query that uses date functions (EXTRACT, TO_CHAR,
 * date_trunc).  Symptoms:
 *
 *   • Dashboard "citas esta semana" column chart: appointments scheduled
 *     for Sunday 8pm–midnight Venezuela appear in Monday's column (UTC day).
 *   • Dashboard contacts-by-month chart: contacts created in the last ~4h
 *     of any month are bucketed into the next month (UTC month).
 *   • Birthday notifications: EXTRACT(MONTH/DAY FROM birth_date) uses UTC,
 *     diverging from the Venezuela calendar date the user intended.
 *
 * Setting TimeZone = 'America/Caracas' on the connection makes PostgreSQL's
 * date functions agree with Node.js local time.  Timestamps are still stored
 * in UTC — this only changes how functions like EXTRACT and TO_CHAR
 * *interpret* timestamptz values when returning them to the application.
 *
 * drizzle-kit migrations use DATABASE_DIRECT_URL with their own connection
 * and are not affected by this setting.
 */

const connectionString = process.env.DATABASE_URL;

export const db: ReturnType<typeof drizzle<typeof schema>> = connectionString
  ? drizzle(
      postgres(connectionString, {
        max: process.env.NODE_ENV === "production" ? 10 : 1,
        idle_timeout: 20,
        connect_timeout: 10,
        // Align the DB session timezone with the app container's TZ env var.
        // This single setting resolves all UTC/Venezuela date drift in SQL
        // date functions without modifying individual queries.
        connection: { TimeZone: "America/Caracas" },
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
