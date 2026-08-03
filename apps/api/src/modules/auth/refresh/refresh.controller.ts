import { UnauthorizedError } from "#src/middleware/error.middleware";
import { COOKIE_NAMES } from "#src/utils/constants";
import { NextFunction, Request, Response } from "express";
import { refreshService } from "#src/services/refresh.service";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "#src/utils/cookieHandler";
import { logger } from "#src/config/logger";

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token missing");
    }

    const result = await refreshService(refreshToken, {
      ip: req.ip,
      ua: req.headers["user-agent"],
    });

    // Clear old cookies
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    // Set new
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    res.sendResponse(200, null, "Token refreshed");
  } catch (err) {
    next(err);
  }
}
