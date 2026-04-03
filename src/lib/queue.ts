import { Queue } from "bullmq";
import IORedis from "ioredis";

/**
 * Redis connection for BullMQ job queues.
 * Uses the same Redis instance as the Data Plane (DB 3 for Propi).
 *
 * BullMQ requires maxmemory-policy=noeviction on Redis.
 * Our Redis doesn't set maxmemory, so all keys are retained (safe).
 */

const REDIS_URL = process.env.REDIS_URL || "redis://:password@10.0.1.20:6379/3";

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
