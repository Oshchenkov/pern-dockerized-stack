import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { httpLogger } from "./middleware/httpLogger.middleware.js";
import { requestTracker } from "./middleware/requestTracker.middleware.js";
import { responseTracker } from "./middleware/responseTracker.middleware.js";
import { responseFormatterMiddleware } from "./middleware/responseFormatter.middleware.js";
// import { authenticate, authorize } from "./middleware/auth.middleware.js";

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
// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Custom middlewares
httpLogger(app); // 1. morgan (raw HTTP log)
app.use(requestTracker); // 2. attach requestId + log incoming
app.use(responseTracker); // 3. hook 'finish' for outgoing log
app.use(responseFormatterMiddleware); // 4. attach res.sendResponse

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
