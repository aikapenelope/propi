import { Queue } from "bullmq";
import { Redis } from "ioredis";

/**
 * Redis connection for BullMQ job queues.
 * Uses the same Redis instance as the Data Plane (DB 3 for Propi).
 *
 * BullMQ requires maxmemory-policy=noeviction on Redis.
 * Redis is configured with --maxmemory 1gb --maxmemory-policy noeviction.
 *
 * Why `{ Redis } from "ioredis"` instead of `IORedis from "ioredis"`?
 * ─────────────────────────────────────────────────────────────────────
 * BullMQ bundles its own copy of ioredis internally.  When the Docker
 * build installs packages fresh (no local node_modules cache), TypeScript
 * sees two distinct `AbstractConnector` class hierarchies — one from the
 * top-level ioredis and one from bullmq/node_modules/ioredis — and fails
 * with "Property 'connecting' is protected but type 'AbstractConnector' is
 * not a class derived from 'AbstractConnector'".
 *
 * Using the named `Redis` export (instead of the default `IORedis`) and
 * passing raw connection options (not a Redis instance) eliminates the
 * type mismatch entirely: BullMQ constructs its own Redis client internally
 * using its bundled ioredis, so there is only one type hierarchy in play.
 *
 * This module must NOT be imported at the top level of Next.js route files
 * because REDIS_URL is absent during `next build`. Use dynamic import instead:
 *
 *   const { marketSyncQueue } = await import("@/lib/queue");
 */

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  throw new Error(
    "REDIS_URL is not set. BullMQ queues require a Redis connection.",
  );
}

// Parse the Redis URL into explicit options so BullMQ can construct its own
// internal Redis client using its bundled ioredis — avoiding the dual-version
// type conflict that arises when passing an externally-constructed Redis instance.
const parsedUrl = new URL(REDIS_URL);

/** Shared Redis connection options for queue producers */
const redisOptions = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || "6379", 10),
  password: parsedUrl.password || undefined,
  db: parsedUrl.pathname ? parseInt(parsedUrl.pathname.slice(1) || "0", 10) : 0,
  maxRetriesPerRequest: null as null, // Required by BullMQ workers
  enableReadyCheck: false,
  lazyConnect: true,
  tls: parsedUrl.protocol === "rediss:" ? {} : undefined,
};

// ---------------------------------------------------------------------------
// Queues (producers - used in Next.js API routes)
// ---------------------------------------------------------------------------

/** Queue for MercadoLibre market sync jobs */
export const marketSyncQueue = new Queue("market-sync", {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// Keep a named export for any code that needs a direct Redis client
// (e.g. workers running outside Next.js). This uses the same options
// so there is a single source of truth for connection config.
export const redisConnection = new Redis(redisOptions);
