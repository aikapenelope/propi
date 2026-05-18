import { Resend } from "resend";
import IORedis from "ioredis";

/**
 * Email sending via Resend with monthly rate limiting.
 *
 * Rate limit: 3,000 emails per calendar month per API key.
 * Matches Resend's free tier to prevent unexpected charges.
 * Tracked in Redis with key `email:month:{YYYY-MM}:{apiKeyPrefix}`.
 *
 * Priority for API key:
 * 1. Per-user key passed via `apiKey` param (from socialAccounts)
 * 2. Global env var RESEND_API_KEY (fallback for system emails)
 */

const MONTHLY_EMAIL_LIMIT = 3_000;
const REDIS_TIMEOUT_MS = 2_000;

// ---------------------------------------------------------------------------
// Redis connection dedicated to the rate limiter.
// Separate from BullMQ's connection because BullMQ requires
// maxRetriesPerRequest: null (commands queue forever), which would
// cause sendEmail to hang if Redis goes down. This connection uses
// a finite retry count so commands fail fast and we can fail open.
// ---------------------------------------------------------------------------

let rateLimitRedis: IORedis | null = null;

function getRateLimitRedis(): IORedis | null {
  if (rateLimitRedis) return rateLimitRedis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  rateLimitRedis = new IORedis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: REDIS_TIMEOUT_MS,
    commandTimeout: REDIS_TIMEOUT_MS,
  });

  // Suppress connection errors (we fail open)
  rateLimitRedis.on("error", () => {});

  return rateLimitRedis;
}

// ---------------------------------------------------------------------------
// Resend client cache
// ---------------------------------------------------------------------------

/** Cache Resend clients by API key to avoid re-creating on every call. */
const clientCache = new Map<string, Resend>();

function getResend(apiKey?: string): Resend {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "No hay API key de Resend configurada. Ve a Configuracion para agregar tu key, o contacta al administrador.",
    );
  }

  const cached = clientCache.get(key);
  if (cached) return cached;

  const client = new Resend(key);
  clientCache.set(key, client);
  return client;
}

export function getMailFrom(): string {
  return process.env.MAIL_FROM || "Propi <noreply@propi.aikalabs.cc>";
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/** Derive a Redis key prefix from an API key (16 chars to avoid collisions). */
function keyPrefix(apiKey?: string): string {
  const key = apiKey || process.env.RESEND_API_KEY || "global";
  return key.slice(0, 16);
}

/** Get the current monthly email count. Returns null if Redis is unavailable. */
async function getCount(apiKey?: string): Promise<number | null> {
  const redis = getRateLimitRedis();
  if (!redis) return null;

  try {
    const month = new Date().toISOString().slice(0, 7);
    const redisKey = `email:month:${month}:${keyPrefix(apiKey)}`;
    const val = await redis.get(redisKey);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return null;
  }
}

/** Increment the monthly counter after a successful send. */
async function incrementCount(apiKey?: string): Promise<void> {
  const redis = getRateLimitRedis();
  if (!redis) return;

  try {
    const month = new Date().toISOString().slice(0, 7);
    const redisKey = `email:month:${month}:${keyPrefix(apiKey)}`;
    const count = await redis.incr(redisKey);
    // Set expiry on first increment (45 days to cover month boundary)
    if (count === 1) {
      await redis.expire(redisKey, 45 * 24 * 60 * 60);
    }
  } catch {
    // Redis unavailable — don't block
  }
}

/**
 * Get the current monthly email count for an API key.
 * Useful for displaying usage in the UI.
 */
export async function getMonthlyEmailCount(apiKey?: string): Promise<number> {
  return (await getCount(apiKey)) ?? 0;
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

/**
 * Send an email via Resend.
 * Pass `apiKey` to use a per-user Resend key instead of the global one.
 *
 * Enforces a monthly limit of 3,000 emails per API key to match
 * Resend's free tier and prevent unexpected charges.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  /** Per-user Resend API key. Falls back to RESEND_API_KEY env var. */
  apiKey?: string;
}): Promise<{ id: string }> {
  // Check monthly rate limit before sending
  const count = await getCount(params.apiKey);
  if (count !== null && count >= MONTHLY_EMAIL_LIMIT) {
    throw new Error(
      `Limite mensual de emails alcanzado (${MONTHLY_EMAIL_LIMIT.toLocaleString()}/mes). ` +
        "El contador se reinicia el primer dia del proximo mes.",
    );
  }

  const resend = getResend(params.apiKey);

  const { data, error } = await resend.emails.send({
    from: params.from || getMailFrom(),
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  // Increment counter AFTER successful send so failed attempts don't burn quota
  await incrementCount(params.apiKey);

  return { id: data?.id || "" };
}
