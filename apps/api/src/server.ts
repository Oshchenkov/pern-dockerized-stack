import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import app from "./app.js";
import { prisma } from "#src/config/prisma";
import { redis } from "#src/config/redis";
import { env } from "./config/env";
import { logger } from "./config/logger";
import {
  initMaintenanceQueue,
  closeMaintenanceQueue,
} from "#src/jobs/maintenance.queue";
import {
  startMaintenanceWorker,
  stopMaintenanceWorker,
} from "#src/jobs/maintenance.worker";

const PORT = process.env.PORT;
const TLS_CERT = "/certs/tls/tls.crt";
const TLS_KEY = "/certs/tls/tls.key";

if (!PORT) {
  throw new Error("❌ CRITICAL: PORT environment variable is not defined!");
}

// ==========================================
// CONNECTION TEST FUNCTIONS
// ==========================================
const testPrismaConnection = async () => {
  await prisma.$queryRaw`SELECT 1`;
  logger.info("✅ Prisma (Database) connected successfully.");
};

const testRedisConnection = async () => {
  const pong = await redis.ping();
  if (pong !== "PONG") {
    throw new Error("Redis PING test failed.");
  }
  logger.info("✅ Redis connected successfully.");
};

// ==========================================
// SERVER & SHUTDOWN LOGIC
// ==========================================
const startServer = async () => {
  let server: http.Server | https.Server | undefined;

  const gracefulShutdown = async (reason: string, exitCode: number = 0) => {
    logger.warn(`${reason} received. Shutting down gracefully...`);

    const forceKillTimer = setTimeout(() => {
      logger.fatal("Forced exit — graceful shutdown timed out");
      process.exit(1);
    }, 15_000);
    forceKillTimer.unref();

    try {
      // 1. Stop accepting new HTTP requests
      if (server) {
        server.close();
        logger.info("🔌 HTTP server closed (no new connections).");
      }

      // 2. Stop BullMQ worker (waits for in-flight job to finish)
      await stopMaintenanceWorker();
      logger.info("🔌 BullMQ worker stopped.");

      // 3. Close BullMQ queue (releases its internal ioredis connections)
      await closeMaintenanceQueue();
      logger.info("🔌 BullMQ queue closed.");

      // 4. Disconnect YOUR app-level ioredis client
      if (redis.status !== "end" && redis.status !== "close") {
        await redis.quit();
        logger.info("🔌 Redis (app) disconnected.");
      } else {
        logger.info("ℹ️ Redis (app) was already closed.");
      }

      // 5. Disconnect Prisma
      await prisma.$disconnect();
      logger.info("🔌 Prisma disconnected.");
    } catch (err) {
      logger.error({ err }, "❌ Error during cleanup");
    } finally {
      clearTimeout(forceKillTimer);
      process.exit(exitCode);
    }
  };

  try {
    // ── 1. Verify infrastructure ──
    await Promise.all([testPrismaConnection(), testRedisConnection()]);

    // ── 2. Init BullMQ queue + register repeatable schedules ──
    await initMaintenanceQueue();
    logger.info("✅ BullMQ queue initialized.");

    // ── 3. Start BullMQ worker ──
    startMaintenanceWorker();

    // ── 4. Create HTTP/HTTPS server ──
    function createServer(): http.Server | https.Server {
      if (env.isDevelopment && fs.existsSync(TLS_CERT)) {
        return https.createServer(
          {
            cert: fs.readFileSync(TLS_CERT),
            key: fs.readFileSync(TLS_KEY),
          },
          app,
        );
      }
      return http.createServer(app);
    }

    server = createServer();

    server.listen(env.PORT, () => {
      const proto = server instanceof https.Server ? "https" : "http";
      logger.info(`🚀 API → ${proto}://localhost:${env.PORT}`);
    });

    // ── 5. Standard terminal signals (clean exits) ──
    process.on("SIGTERM", () =>
      gracefulShutdown("SIGTERM (Process Manager requested stop)", 0),
    );
    process.on("SIGINT", () => gracefulShutdown("SIGINT (Ctrl+C)", 0));

    // ── 6. Fatal crash handlers (dirty exits) ──
    process.on("uncaughtException", (err: Error) => {
      logger.fatal({ err }, "💥 UNCAUGHT EXCEPTION");
      gracefulShutdown("uncaughtException", 1);
    });

    process.on("unhandledRejection", (reason: unknown) => {
      logger.fatal({ reason }, "💥 UNHANDLED PROMISE REJECTION");
      gracefulShutdown("unhandledRejection", 1);
    });
  } catch (error) {
    logger.fatal({ error }, "❌ Failed to start server");
    await gracefulShutdown("Startup Failure", 1);
  }
};

startServer();
