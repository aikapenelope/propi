import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use DATABASE_DIRECT_URL (port 5432, direct Postgres) for migrations.
    // PgBouncer (port 6432) is in transaction mode and cannot run DDL.
    // Falls back to DATABASE_URL if DATABASE_DIRECT_URL is not set.
    url:
      process.env.DATABASE_DIRECT_URL ||
      process.env.DATABASE_URL ||
      "postgresql://platform:password@10.0.1.20:5432/propi",
  },
});
