import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/server/schema";

/**
 * Database connection for Propi.
 *
 * Uses PgBouncer (port 6432) for connection pooling in production.
 * Falls back to direct Postgres (port 5432) for migrations.
 *
 * Required env var: DATABASE_URL
 * Example: postgresql://platform:<pw>@10.0.1.20:6432/propi
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Use a single connection for migrations, pooled for queries
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
