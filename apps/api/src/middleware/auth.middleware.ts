import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "#src/services/token.service";
import { denylistService } from "#src/services/denylist.service";
import { prisma } from "#src/config/prisma";
import {
  UnauthorizedError,
  ForbiddenError,
  AppError,
} from "#src/middleware/error.middleware";
import { COOKIE_NAMES } from "#src/utils/constants";
import { UserStatus, SessionStatus } from "#root/prisma/generated/prisma/enums";
import { logger } from "#src/config/logger";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    // ── 1. Extract token ──────────────────────────────────────────────
    const token =
      req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN] ??
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedError("Access token required");
    }

    // ── 2. Verify JWT signature + expiry ──────────────────────────────
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // Guard: sub must exist
    if (!payload.sub) {
      throw new UnauthorizedError("Malformed token");
    }

    // ── 3. Denylist check (Redis, sub-ms) ─────────────────────────────
    if (payload.jti && (await denylistService.isDenied(payload.jti))) {
      throw new UnauthorizedError("Token revoked");
    }

    // ── 4. User + session in ONE query ────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        tokenVersion: true,
        status: true,
        // Pull session in the same round-trip
        sessions: payload.sid
          ? {
              where: { id: payload.sid },
              select: { status: true, expiresAt: true },
              take: 1,
            }
          : false,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenError("Account suspended");
    }

    if (payload.tv !== user.tokenVersion) {
      throw new UnauthorizedError("Token invalidated — please sign in again");
    }

    // ── 5. Session liveness ───────────────────────────────────────────
    if (payload.sid) {
      const session = Array.isArray(user.sessions) ? user.sessions[0] : null;

      if (!session) {
        throw new UnauthorizedError("Session not found");
      }

      if (
        session.status !== SessionStatus.ACTIVE ||
        session.expiresAt < new Date()
      ) {
        throw new UnauthorizedError("Session expired or revoked");
      }
    }

    // ── 6. Attach to request ──────────────────────────────────────────
    req.user = payload;
    next();
  } catch (err) {
    // Pass through known auth errors as-is
    if (err instanceof AppError) {
      return next(err);
    }

    // Unexpected error (DB down, Redis crash, bug) — log and return 500
    logger.error({ err }, "authenticate: unexpected error");
    next(err);
  }
}
