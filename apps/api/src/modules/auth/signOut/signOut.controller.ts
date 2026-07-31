import { verifyAccessToken } from "#src/services/token.service";
import { NextFunction, Request, Response } from "express";
import { signOutService } from "./signOut.service";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} from "#src/utils/cookieHandler";
import { COOKIE_NAMES } from "#src/utils/constants";

export async function signOutController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    const accessToken = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

    let accessJti: string | undefined;
    let userId: string | undefined;

    if (accessToken) {
      try {
        const payload = await verifyAccessToken(accessToken);
        accessJti = payload.jti;
        userId = payload.sub;
      } catch {
        /* expired — fine */
      }
    }

    if (refreshToken) {
      await signOutService(refreshToken, accessJti, userId);
    }

    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    res.sendResponse(200, null, "Logged out");
  } catch (err) {
    next(err);
  }
}
