import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

// import { usersRouter, productsRouter, ordersRouter } from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { greet } from "@repo/shared-types";

const app: Application = express();

console.log(
  `\n🔧 Starting server in ${process.env.NODE_ENV} mode..., PORT: ${process.env.PORT}`,
);

// ==============================
// 🛠️ MIDDLEWARES
// ==============================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// 🛣️ ROUTES
// ==============================

// app.use("/api/users", usersRouter);
// app.use("/api/products", productsRouter);
// app.use("/api/orders", ordersRouter);

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

// ==============================
// 🚨 GLOBAL ERROR HANDLER
// ==============================
app.use(notFound);
app.use(errorHandler);

console.log(greet("🚀 Server run @repo/shared-types"));

export default app;
