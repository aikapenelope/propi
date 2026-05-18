import { Queue } from "bullmq";
import IORedis from "ioredis";

/**
 * Redis connection for BullMQ job queues.
 * Uses the same Redis instance as the Data Plane (DB 3 for Propi).
 *
 * BullMQ requires maxmemory-policy=noeviction on Redis.
 * Redis is configured with --maxmemory 1gb --maxmemory-policy noeviction.
 *
 * Connection is created lazily so the module can be imported at build time
 * (when REDIS_URL is absent) without throwing. The error surfaces at runtime
 * when a queue operation is actually attempted.
 */

let _connection: IORedis | null = null;

function getRedisConnection(): IORedis {
  if (_connection) return _connection;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "REDIS_URL is not set. BullMQ queues require a Redis connection.",
    );
  }

  _connection = new IORedis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ workers
    enableReadyCheck: false,
    lazyConnect: true,
  });

  return _connection;
}

/** Shared Redis connection for queue producers (adding jobs from Next.js) */
export const redisConnection = new Proxy({} as IORedis, {
  get(_target, prop) {
    return Reflect.get(getRedisConnection(), prop);
  },
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

/** Queue for email campaign sends (offloaded from request to avoid timeout) */
export const emailCampaignQueue = new Queue("email-campaign", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 200 },
  },
});
