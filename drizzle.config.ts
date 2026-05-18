import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // DATABASE_DIRECT_URL bypasses PgBouncer (port 5432) for DDL operations.
    // Falls back to DATABASE_URL for environments without PgBouncer.
    url:
      process.env.DATABASE_DIRECT_URL ||
      process.env.DATABASE_URL ||
      "",
  },
});
