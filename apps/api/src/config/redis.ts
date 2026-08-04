import Redis from "ioredis";
import { logger } from "#src/config/logger";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error(
    "❌ CRITICAL: REDIS_URL environment variable is not defined!",
  );
}

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 2,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err: Error) => logger.error(`Redis error: ${err}`));
redis.on("close", () => logger.warn("Redis connection closed"));

function redisExecuteWhenConnected(callback: () => void) {
  // ioredis statuses: 'connect', 'ready', 'connecting', 'reconnecting', 'end', 'wait'
  if (redis.status === "ready" || redis.status === "connect") {
    callback();
  } else {
    // Attach a one-time listener that automatically removes itself after firing
    redis.once("ready", callback);
  }
}

export { redis, redisExecuteWhenConnected };
