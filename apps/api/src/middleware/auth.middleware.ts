import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";
import { logger } from "../utils/logger.js";
import type { AuthUser } from "../types/express.js";

// ── JWT Secret ───────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// ── Verify token (sync — simpler than callback) ──────────────────────
const verifyToken = (token: string): AuthUser => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & jwt.JwtPayload;

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "Token expired");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError(403, "Invalid token");
    }
    if (err instanceof jwt.NotBeforeError) {
      throw new AppError(403, "Token not yet active");
    }
    throw new AppError(403, "Token verification failed");
  }
};

// ── Auth middleware ──────────────────────────────────────────────────
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  // Must be: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Access token required");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError(401, "Access token required");
  }

  req.user = verifyToken(token);

  logger.debug(
    `Authenticated: ${req.user.email} (${req.user.role})`,
    req.requestId,
  );

  next();
};

// ── Role guard (use after authenticate) ──────────────────────────────
export const authorize = (...roles: AuthUser["role"][]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "Not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "Insufficient permissions", {
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};
