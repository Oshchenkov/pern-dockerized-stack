import { NextFunction, Request, Response } from "express";
import { signOutService } from "./signOut.service";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} from "#src/utils/cookieHandler";
import { COOKIE_NAMES } from "#src/utils/constants";
import { decodeJwt } from "jose";

export async function signOutController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accessToken = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

    if (accessToken) {
      // decodeJwt reads claims WITHOUT verifying expiry.
      // Safe here: the cookie is HttpOnly and was set by the server,
      // so the signature is trustworthy even if the token expired.
      const payload = decodeJwt(accessToken);

      if (payload.sub && payload.sid) {
        await signOutService({
          userId: payload.sub as string,
          sessionId: payload.sid as string,
          accessJti: payload.jti as string | undefined,
          accessExp: payload.exp,
        });
      }
    }

    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    res.sendResponse(200, null, "Logged out");
  } catch (err) {
    next(err);
  }
}
