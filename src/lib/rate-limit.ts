import IORedis from "ioredis";

/**
 * Distributed rate limiter backed by Redis.
 *
 * Uses a sliding window counter via Redis INCR + EXPIRE. When Redis is
 * unavailable, the limiter fails open (allows the request) to avoid
 * blocking legitimate users due to infrastructure issues.
 *
 * Design decisions:
 * - Separate Redis connection from BullMQ (finite retries, fast timeout)
 * - Lazy connect: no connection attempt until first rate-limit check
 * - Singleton connection shared across all limiters in the process
 * - TTL-based cleanup: Redis handles expiry, no manual purging needed
 *
 * Usage:
 *   const limiter = createRateLimiter({ prefix: "upload", limit: 20, windowMs: 60_000 });
 *   const allowed = await limiter.check(userId);
 *   if (!allowed) return Response.json({ error: "Too many requests" }, { status: 429 });
 */

// ---------------------------------------------------------------------------
// Shared Redis connection (singleton)
// ---------------------------------------------------------------------------

const REDIS_TIMEOUT_MS = 2_000;

let redis: IORedis | null = null;

function getRedis(): IORedis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  redis = new IORedis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: REDIS_TIMEOUT_MS,
    commandTimeout: REDIS_TIMEOUT_MS,
  });

  // Suppress connection errors — we fail open when Redis is down.
  redis.on("error", () => {});

  return redis;
}

// ---------------------------------------------------------------------------
// Rate limiter factory
// ---------------------------------------------------------------------------

export interface RateLimiterConfig {
  /** Redis key prefix (e.g. "rl:upload", "rl:chat"). Must be unique per limiter. */
  prefix: string;
  /** Maximum number of requests allowed within the window. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

export interface RateLimiter {
  /**
   * Check if the given key (userId, IP, etc.) is within the rate limit.
   * Returns true if the request is allowed, false if rate-limited.
   * Fails open (returns true) if Redis is unavailable.
   */
  check(key: string): Promise<boolean>;
}

/**
 * Create a distributed rate limiter instance.
 *
 * Each call to `check(key)` increments a counter in Redis with a TTL
 * equal to the window duration. The counter resets automatically when
 * the TTL expires (fixed window algorithm).
 *
 * Fixed window is chosen over sliding window for simplicity and because
 * the existing in-memory limiters already use fixed windows. The worst-case
 * burst at window boundaries (2x limit) is acceptable for these use cases.
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const { prefix, limit, windowMs } = config;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return {
    async check(key: string): Promise<boolean> {
      const client = getRedis();
      if (!client) {
        // No Redis configured — fail open (allow request).
        return true;
      }

      try {
        const redisKey = `${prefix}:${key}`;
        const count = await client.incr(redisKey);

        // Set TTL only on first increment (when count transitions from 0 to 1).
        // This avoids resetting the TTL on every request within the window.
        if (count === 1) {
          await client.expire(redisKey, windowSeconds);
        }

        return count <= limit;
      } catch {
        // Redis error — fail open to avoid blocking legitimate users.
        return true;
      }
    },
  };
}
