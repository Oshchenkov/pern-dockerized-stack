import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

// import { usersRouter, productsRouter, ordersRouter } from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { greet } from "@repo/shared-types";
// import "@/test.js";

import { prisma } from "#src/db/prisma";

const app = express();
const PORT = process.env.PORT || 4000;

console.log(
  `\n🔧 Starting server in ${process.env.NODE_ENV} mode..., PORT: ${process.env.PORT}`,
);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// async function main() {
//   // Create a new user with a post
//   const user = await prisma.user.create({
//     data: {
//       name: "Alice",
//       email: "alice22@prisma.io",
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

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API info ──────────────────────────────────────────────────────────────────
app.get("/api", (_req, res) => {
  res.json({
    name: "Express TS Demo API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      products: "/api/products",
      orders: "/api/orders",
    },
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────

// app.use("/api/users", usersRouter);
// app.use("/api/products", productsRouter);
// app.use("/api/orders", ordersRouter);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

console.log(greet("🚀 Server run @repo/shared-types"));

// ── Bootstrap ─────────────────────────────────────────────────────────────────
(async (): Promise<void> => {
  try {
    // await testConnection();
    // await runMigrations();
    // await seedData();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`   API root : http://localhost:${PORT}/api`);
      console.log(`   Health   : http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
