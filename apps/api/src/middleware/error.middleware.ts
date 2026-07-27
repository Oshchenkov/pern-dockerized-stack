import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

// ── Custom Error Class ───────────────────────────────────────────────
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ── 404 Handler ──────────────────────────────────────────────────────
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Other errors

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super(401, `UNAUTHORIZED: ${message}`, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied", details?: unknown) {
    super(403, `FORBIDDEN: ${message}`, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: unknown) {
    super(409, `CONFLICT: ${message}`, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: unknown) {
    super(429, `TOO_MANY_REQUESTS: ${message}`, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request", details?: unknown) {
    super(400, `BAD_REQUEST: ${message}`, details);
  }
}

// ── Global Error Handler ─────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Guard: headers already sent (e.g. streaming response failed mid-way)
  if (res.headersSent) {
    return;
  }

  // ── Known application errors ─────────────────────────────────────
  if (err instanceof AppError) {
    res.sendResponse(err.statusCode, err.details ?? null, err.message);
    return;
  }

  // ── PostgreSQL errors ────────────────────────────────────────────
  const pgError = err as {
    code?: string;
    detail?: string;
    constraint?: string;
  };

  if (pgError.code === "23505") {
    res.sendResponse(409, { detail: pgError.detail }, "Duplicate entry");
    return;
  }

  if (pgError.code === "23503") {
    res.sendResponse(
      400,
      { detail: pgError.detail },
      "Referenced record not found",
    );
    return;
  }

  if (pgError.code === "23514") {
    res.sendResponse(
      400,
      { constraint: pgError.constraint },
      "Value violates check constraint",
    );
    return;
  }

  // ── Unknown / unhandled errors ───────────────────────────────────
  logger.error(`Unhandled error: ${err.message}`, req.requestId, {
    stack: err.stack,
    path: req.originalUrl,
  });

  const data =
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null;

  res.sendResponse(500, data, "Internal server error");
};
