import "@/loadEnv";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { testConnection } from "./db/pool.js";
import { runMigrations, seedData } from "./db/migrations.js";
import { usersRouter, productsRouter, ordersRouter } from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { greet } from "@repo/shared-types";

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
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

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
