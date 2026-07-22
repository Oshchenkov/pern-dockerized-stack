import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const responseTracker = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  // Listen for the 'finish' event instead of overriding res.send
  // → works with res.json(), res.send(), res.sendFile(), streams, etc.
  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta = {
      status: res.statusCode,
      duration: `${duration}ms`,
      length: res.get("content-length") ?? "—",
    };

    if (res.statusCode >= 500) {
      logger.error(`⬆️  ${req.method} ${req.originalUrl}`, req.requestId, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(`⬆️  ${req.method} ${req.originalUrl}`, req.requestId, meta);
    } else {
      logger.info(`⬆️  ${req.method} ${req.originalUrl}`, req.requestId, meta);
    }
  });

  next();
};
