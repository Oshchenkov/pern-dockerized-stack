import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { httpLogger } from "./middleware/httpLogger.middleware.js";
import { requestTracker } from "./middleware/requestTracker.middleware.js";
import { responseTracker } from "./middleware/responseTracker.middleware.js";
import { responseFormatterMiddleware } from "./middleware/responseFormatter.middleware.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { greet } from "@repo/shared-types";
import { v1Router } from "#src/routes/index";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "#src/config/pino.logger";
// import { authenticate, authorize } from "./middleware/auth.middleware.js";

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
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Custom middlewares
httpLogger(app); // 1. morgan (raw HTTP log)
app.use(requestTracker); // 2. attach requestId + log incoming
app.use(responseTracker); // 3. hook 'finish' for outgoing log
app.use(responseFormatterMiddleware); // 4. attach res.sendResponse
app.use(
  pinoHttp({
    logger,
    genReqId: () => randomUUID(),
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) {
        return "error";
      }

      if (res.statusCode >= 400) {
        return "warn";
      }

      return "info";
    },
  }),
);

// ==============================
// 🛣️ ROUTES
// ==============================

app.use("/api/v1", v1Router);

// ==============================
// 🚨 GLOBAL ERROR HANDLER
// ==============================
app.use(notFound);
app.use(errorHandler);

console.log(greet("🚀 Server run @repo/shared-types"));

export default app;
