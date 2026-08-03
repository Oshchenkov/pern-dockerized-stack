// src/middleware/authenticate.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "#src/services/token.service";
import { denylistService } from "#src/services/denylist.service";
import { sessionService } from "#src/services/session.service";
import { prisma } from "#src/config/prisma";
import {
  UnauthorizedError,
  ForbiddenError,
} from "#src/middleware/error.middleware";
import { COOKIE_NAMES } from "#src/utils/constants";
import { UserStatus } from "#root/prisma/generated/prisma/enums";

/**
 * OWASP: Validate access token on every protected request.
 * Checks: signature → expiry → denylist → tokenVersion → session active → user status.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token =
      req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN] ??
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedError("Access token required");
    }

    // 1. Verify signature + expiry (jose)
    const payload = await verifyAccessToken(token);

    // 2. Check denylist (Redis fast path)
    if (payload.jti && (await denylistService.isDenied(payload.jti))) {
      throw new UnauthorizedError("Token revoked");
    }

    // 3. Verify tokenVersion (invalidated on password change / admin action)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub! },
      select: { tokenVersion: true, status: true },
    });

    if (!user) throw new UnauthorizedError("User not found");
    if (user.status === UserStatus.BANNED)
      throw new ForbiddenError("Account suspended");
    if (payload.tv !== user.tokenVersion) {
      throw new UnauthorizedError("Token invalidated — please sign in again");
    }

    // 4. Verify session is still active
    if (payload.sid && !(await sessionService.isActive(payload.sid))) {
      throw new UnauthorizedError("Session expired or revoked");
    }

    req.user = payload;
    next();
  } catch (err) {
    next(
      err instanceof UnauthorizedError || err instanceof ForbiddenError
        ? err
        : new UnauthorizedError("Invalid token"),
    );
  }
}
