import { Request, Response, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

// ── Types ────────────────────────────────────────────────────────────
interface LimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

// ── Defaults ─────────────────────────────────────────────────────────
const DEFAULTS: Required<LimiterOptions> = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, slow down!",
};

// ── Factory ──────────────────────────────────────────────────────────
export const limiter = (overrides: LimiterOptions = {}): RequestHandler => {
  const { windowMs, max, message } = { ...DEFAULTS, ...overrides };

  return rateLimit({
    store: new RedisStore({
      // @ts-expect-error – ioredis v5 compat
      sendCommand: (...args: string[]) => redis.call(...args),
    }),

    windowMs,
    max,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    keyGenerator: (req: Request) => `${req.ip}:${req.baseUrl}${req.path}`,

    // ✅ Use global response formatter
    handler: (req: Request, res: Response) => {
      logger.warn(
        `Rate limit exceeded: ${req.method} ${req.originalUrl}`,
        req.requestId,
        {
          ip: req.ip,
        },
      );

      res.sendResponse(429, null, message);
    },
  });
};
