import { Queue } from "bullmq";

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

// ---------------------------------------------------------------------------
// Queues (producers - used in Next.js API routes)
// ---------------------------------------------------------------------------

/**
 * BullMQ connection config.
 *
 * Passing a RedisOptions object instead of an IORedis instance avoids a
 * type-conflict between the project's top-level ioredis and the version
 * vendored inside bullmq/node_modules/ioredis.  The two copies can drift
 * across npm installs (especially in Docker builds where the lockfile is
 * regenerated for linux-x64).  A plain object keeps both sides happy.
 */
const connection = {
  host: new URL(REDIS_URL).hostname,
  port: Number(new URL(REDIS_URL).port) || 6379,
  password: new URL(REDIS_URL).password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

/** Queue for MercadoLibre market sync jobs */
export const marketSyncQueue = new Queue("market-sync", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
