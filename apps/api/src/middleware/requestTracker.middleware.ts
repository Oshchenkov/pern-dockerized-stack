import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

export const requestTracker = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.requestTime = new Date().toISOString();
  req.requestId = randomUUID().slice(0, 9); // e.g. "a3f1b9c2e"

  logger.info(`⬇️  ${req.method} ${req.originalUrl}`, req.requestId, {
    ip: req.ip,
    agent: req.get("user-agent"),
    query: Object.keys(req.query).length ? req.query : undefined,
  });

  next();
};
