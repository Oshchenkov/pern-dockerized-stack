import { Request, Response, RequestHandler } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis.js";
import { logger } from "#src/config/logger";

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
    keyGenerator: (req: Request) => {
      const safeIp = ipKeyGenerator(req.ip ?? "");
      return `${safeIp}:${req.baseUrl}${req.path}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn(
        {
          ip: req.ip,
          requestId: req.requestId,
        },
        `Rate limit exceeded: ${req.method} ${req.originalUrl}`,
      );

      res.sendResponse(429, null, message);
    },
  });
};
