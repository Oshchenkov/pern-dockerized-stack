import { Request, Response, RequestHandler, Application } from "express";
import rateLimit, {
  type Options as RateLimitOptions,
} from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis";
import { logger } from "../utils/logger";

// ── Types ────────────────────────────────────────────────────────────
interface LimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

// ── Defaults ─────────────────────────────────────────────────────────
const DEFAULTS: Required<LimiterOptions> = {
  windowMs: 15 * 60 * 1000, // 15 min
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

    // key by IP + route → each route gets its own counter
    keyGenerator: (req: Request) => `${req.ip}:${req.baseUrl}${req.path}`,

    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
        data: null,
        timestamp: new Date().toISOString(),
      });
    },
  });
};
