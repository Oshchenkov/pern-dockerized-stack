import "dotenv/config";
import app from "./app.js";
import { prisma } from "#src/config/prisma";
import { redis, redisExecuteWhenConnected } from "#src/config/redis";

const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("❌ CRITICAL: PORT environment variable is not defined!");
}

// ==========================================
// CONNECTION TEST FUNCTIONS
// ==========================================
const testPrismaConnection = async () => {
  // Forces a live round-trip network query to verify PostgreSQL availability and credentials
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Prisma (Database) connected successfully.");
};

const testRedisConnection = async () => {
  // Sends a PING command to verify the server is actually responding
  const pong = await redis.ping();
  if (pong !== "PONG") {
    throw new Error("Redis PING test failed.");
  }
  console.log("✅ Redis connected successfully.");
};

// ==========================================
// SERVER & SHUTDOWN LOGIC
// ==========================================
const startServer = async () => {
  let server: any;

  // The Graceful Shutdown function now accepts an exit code
  const gracefulShutdown = async (reason: string, exitCode: number = 0) => {
    console.log(`\n⚠️ ${reason} received. Shutting down gracefully...`);

    try {
      // 1. Stop accepting new requests
      if (server) server.close();

      // 2. Disconnect Prisma
      await prisma.$disconnect();
      console.log("🔌 Prisma disconnected.");

      // ioredis statuses: 'wait', 'reconnecting', 'connecting', 'connect', 'ready', 'close', 'end'
      if (redis.status !== "end" && redis.status !== "close") {
        await redis.quit(); // .quit() gracefully closes the connection
        console.log("🔌 ioredis disconnected.");
      } else {
        console.log("ℹ️ ioredis was already closed.");
      }
    } catch (err) {
      console.error("❌ Error during cleanup:", err);
    } finally {
      // 4. Exit the process
      // exitCode 0 = Clean stop (e.g., Ctrl+C, SIGTERM)
      // exitCode 1 = Fatal crash (e.g., uncaughtException)
      process.exit(exitCode);
    }
  };

  try {
    console.log("\n");
    // Run connection tests in parallel for faster startup
    await Promise.all([testPrismaConnection(), testRedisConnection()]);

    // Start Express App ONLY if connections are successful
    server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`   API root : http://localhost:${PORT}/api`);
      console.log(`   Health   : http://localhost:${PORT}/health\n`);
    });

    // ==========================================
    // STANDARD TERMINAL SIGNALS (Clean Exits)
    // ==========================================
    process.on("SIGTERM", () =>
      gracefulShutdown("SIGTERM (Process Manager requested stop)", 0),
    );
    process.on("SIGINT", () => gracefulShutdown("SIGINT (Ctrl+C)", 0));

    // ==========================================
    // FATAL CRASH HANDLERS (Dirty Exits)
    // ==========================================
    process.on("uncaughtException", (err: Error) => {
      console.error("💥 UNCAUGHT EXCEPTION! Server is in an unknown state.");
      console.error(err.stack || err);
      // Exit with code 1 so PM2/Docker knows it crashed and restarts it
      gracefulShutdown("uncaughtException", 1);
    });

    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      console.error("💥 UNHANDLED PROMISE REJECTION!");
      console.error("Reason:", reason);
      // Exit with code 1
      gracefulShutdown("unhandledRejection", 1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    gracefulShutdown("Startup Failure", 1);
  }
};

startServer();

// ---------------
// async function main() {
//   // Create a new user with a post
//   const user = await prisma.user.create({
//     data: {
//       name: "Alice",
//       surname: "Smith",
//       avatarUrl: "https://example.com/alice.png",
//       email: "alice132@prisma.io",
//       emailVerified: true,
//       isActive: true,
//     },
//   });
// }
// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     // process.exit(1);
//   });
