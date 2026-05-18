import { Queue } from "bullmq";
import IORedis from "ioredis";

/**
 * Redis connection and BullMQ queues for Propi.
 * Uses the same Redis instance as the Data Plane (DB 3 for Propi).
 *
 * BullMQ requires maxmemory-policy=noeviction on Redis.
 * Redis is configured with --maxmemory 1gb --maxmemory-policy noeviction.
 *
 * Everything is created lazily via getter functions so this module can be
 * imported at Next.js build time (when REDIS_URL is absent) without throwing.
 * The error surfaces at runtime when a queue operation is actually attempted.
 */

// ---------------------------------------------------------------------------
// Lazy singletons
// ---------------------------------------------------------------------------

let _connection: IORedis | null = null;
let _marketSyncQueue: Queue | null = null;
let _emailCampaignQueue: Queue | null = null;

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

// ---------------------------------------------------------------------------
// Queues (producers - used in Next.js API routes)
// ---------------------------------------------------------------------------

/** Queue for MercadoLibre market sync jobs */
export const marketSyncQueue = {
  get add() {
    if (!_marketSyncQueue) {
      _marketSyncQueue = new Queue("market-sync", {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      });
    }
    return _marketSyncQueue.add.bind(_marketSyncQueue);
  },
} as Queue;

/** Queue for email campaign sends (offloaded from request to avoid timeout) */
export const emailCampaignQueue = {
  get add() {
    if (!_emailCampaignQueue) {
      _emailCampaignQueue = new Queue("email-campaign", {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 10_000 },
          removeOnComplete: { count: 50 },
          removeOnFail: { count: 200 },
        },
      });
    }
    return _emailCampaignQueue.add.bind(_emailCampaignQueue);
  },
} as Queue;
