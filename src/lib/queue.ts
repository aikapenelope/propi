import { Queue } from "bullmq";
import IORedis from "ioredis";

/**
 * Redis connection for BullMQ job queues.
 * Uses the same Redis instance as the Data Plane (DB 3 for Propi).
 *
 * BullMQ requires maxmemory-policy=noeviction on Redis.
 * Redis is configured with --maxmemory 1gb --maxmemory-policy noeviction.
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

/** Shared Redis connection for queue producers (adding jobs from Next.js) */
export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ workers
  enableReadyCheck: false,
  lazyConnect: true,
});

// ---------------------------------------------------------------------------
// Queues (producers - used in Next.js API routes)
// ---------------------------------------------------------------------------

/** Queue for MercadoLibre market sync jobs */
export const marketSyncQueue = new Queue("market-sync", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
