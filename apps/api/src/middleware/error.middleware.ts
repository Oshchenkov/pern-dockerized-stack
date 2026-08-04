import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "#src/config/logger";

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
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// ── HTTP Errors ──────────────────────────────────────────────────────
export class BadRequestError extends AppError {
  constructor(message = "Invalid request", details?: unknown) {
    super(400, message, details);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super(401, message, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied", details?: unknown) {
    super(403, message, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(404, message, details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: unknown) {
    super(409, message, details);
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", details?: unknown) {
    super(429, message, details);
    this.name = "TooManyRequestsError";
  }
}

// ── Session & Token Errors ──────────────────────────────────────────
export class SessionNotFoundError extends AppError {
  constructor(message = "Session not found", details?: unknown) {
    super(401, message, details);
    this.name = "SessionNotFoundError";
  }
}

export class TokenReuseDetectedError extends AppError {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    message = "Token reuse detected",
  ) {
    super(401, message, { familyId, userId });
    this.name = "TokenReuseDetectedError";
  }
}

export class SessionInactiveError extends AppError {
  constructor(message = "Session is inactive", details?: unknown) {
    super(401, message, details);
    this.name = "SessionInactiveError";
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = "Session has expired", details?: unknown) {
    super(401, message, details);
    this.name = "SessionExpiredError";
  }
}

// ── Global Error Handler ─────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (res.headersSent) {
    return;
  }

  // ── 1. Known application errors ──────────────────────────────────
  if (err instanceof AppError) {
    res.sendResponse(err.statusCode, err.details ?? null, err.message);
    return;
  }

  // ── 2. Zod validation errors ─────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    res.sendResponse(400, details, "Validation failed");
    return;
  }

  // ── 3. PostgreSQL errors ─────────────────────────────────────────
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

  // ── 4. Unknown / unhandled errors ────────────────────────────────
  logger.error(
    {
      stack: err.stack,
      path: req.originalUrl,
      requestId: req.requestId,
      err,
    },
    `Unhandled error: ${err.message}`,
  );

  const data =
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null;

  res.sendResponse(500, data, "Internal server error");
};

/*
## Error flow diagram

Request hits a route
        │
        ▼
  Some code throws
        │
        ├─── new UnauthorizedError("...")     ──┐
        ├─── new SessionNotFoundError("...")    │
        ├─── new TokenReuseDetectedError(...)   ├── instanceof AppError? ──► YES
        ├─── new ConflictError("...")           │         │
        ├─── new BadRequestError("...")         │         ▼
        ├─── new TooManyRequestsError("...")  ──┘   errorHandler sends
        │                                          err.statusCode + message
        │
        ├─── new ZodError(issues)              ──── instanceof ZodError? ──► YES
        │                                                │
        │                                                ▼
        │                                          400 + field details
        │
        ├─── Prisma throws { code: "23505" }   ──── pgError.code match ──► YES
        │                                                │
        │                                                ▼
        │                                          409 "Duplicate entry"
        │
        └─── new TypeError("...")              ──── none of the above ──► FALLTHROUGH
        └─── new RangeError("...")                       │
        └─── prisma.$disconnect() crash                  ▼
                                                   logger.error(...)
                                                   500 "Internal server error"

*/
