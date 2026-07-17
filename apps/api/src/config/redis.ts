import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error(
    "❌ CRITICAL: REDIS_URL environment variable is not defined!",
  );
}

const redis = new Redis(redisUrl);

redis.on("error", (err) => {
  console.error("❌ Redis connection error: ", err);
});

redis.on("connect", () => {
  console.log("🚀 Successfully connected to the Redis container!");
});

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
