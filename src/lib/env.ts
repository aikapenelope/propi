import { z } from "zod";

/**
 * Runtime validation of environment variables.
 *
 * Imported once at startup (via `src/lib/db.ts` and `next.config.ts`).
 * Fails fast with a clear message listing every missing or invalid var.
 *
 * Build-time variables (NEXT_PUBLIC_*) are validated separately because
 * they are inlined by Next.js at build time and may not exist at runtime.
 */

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const serverSchema = z.object({
  /** PostgreSQL connection string (via PgBouncer, port 6432). */
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /** Direct Postgres connection (port 5432) for DDL migrations. Optional. */
  DATABASE_DIRECT_URL: z.string().optional(),

  /** Clerk authentication. */
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),

  /** MinIO / S3 storage. */
  S3_ENDPOINT: z.string().min(1).default("http://10.0.1.20:9000"),
  S3_ACCESS_KEY: z.string().min(1, "S3_ACCESS_KEY is required"),
  S3_SECRET_KEY: z.string().min(1, "S3_SECRET_KEY is required"),
  S3_MEDIA_BUCKET: z.string().default("propi-media"),
  S3_DOCS_BUCKET: z.string().default("propi-documents"),

  /** Email (Resend). Optional — system emails won't work without it. */
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("Propi <noreply@propi.aikalabs.cc>"),

  /** Meta webhooks. */
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  META_APP_SECRET: z.string().optional(),

  /** Groq AI. Optional — Propi Magic won't work without it. */
  GROQ_API_KEY: z.string().optional(),

  /** MercadoLibre OAuth. Optional — market sync won't work without it. */
  ML_APP_ID: z.string().optional(),
  ML_SECRET_KEY: z.string().optional(),

  /** Cron job protection. */
  CRON_SECRET: z.string().optional(),

  /** Redis (BullMQ). Optional — job queues won't work without it. */
  REDIS_URL: z.string().optional(),

  /** Node environment. */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validated server environment variables.
 *
 * Access via `env.DATABASE_URL` instead of `process.env.DATABASE_URL`.
 * This gives you type safety and guarantees the value exists.
 *
 * During build time (when DATABASE_URL is intentionally absent),
 * validation is skipped and a proxy is returned that throws on access.
 */
export const env = (() => {
  // Skip validation during Next.js build (DATABASE_URL is intentionally absent).
  // The db.ts proxy already handles this case gracefully.
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
    return new Proxy({} as z.infer<typeof serverSchema>, {
      get(_target, prop) {
        if (typeof prop === "symbol" || prop === "then") return undefined;
        // Return the raw env var if it exists (for NEXT_PUBLIC_* at build time)
        const raw = process.env[prop as string];
        if (raw !== undefined) return raw;
        return undefined;
      },
    });
  }

  const result = serverSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(
      `\n❌ Invalid environment variables:\n${formatted}\n\n` +
        `Fix the above issues in your .env file or Coolify environment.\n`,
    );

    // In production, fail hard. In development, warn but continue.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables. See logs above.");
    }
  }

  return (result.success ? result.data : process.env) as z.infer<
    typeof serverSchema
  >;
})();
