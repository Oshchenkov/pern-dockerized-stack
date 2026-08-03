import type { ConnectionOptions } from "bullmq";
import { env } from "#src/config/env";

/**
 * BullMQ creates its OWN ioredis connections internally
 * (one per Queue, one per Worker). Do NOT pass your shared
 * `redis` instance — BullMQ needs dedicated connections.
 *
 * Just give it the same URL / options and it handles the rest.
 */
export const queueConnection: ConnectionOptions = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number(new URL(env.REDIS_URL).port) || 6379,
  password: new URL(env.REDIS_URL).password || undefined,
  username: new URL(env.REDIS_URL).username || undefined,

  // TLS in production (ElastiCache, Upstash, Aiven, etc.)
  tls: env.isProduction ? {} : undefined,

  // BullMQ requirement: disable built-in retry so it
  // manages reconnection itself
  maxRetriesPerRequest: null,
};
