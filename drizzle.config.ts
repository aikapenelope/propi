import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use direct Postgres (not PgBouncer) for migrations
    url: process.env.DATABASE_URL || "postgresql://platform:password@10.0.1.20:5432/propi",
  },
});
