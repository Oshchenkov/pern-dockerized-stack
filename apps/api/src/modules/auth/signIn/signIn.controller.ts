import { NextFunction, Request, Response } from "express";
import { SignInInput } from "./signIn.validation";
import { signInService } from "./signIn.service";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "#src/utils/cookieHandler";
import { COOKIE_NAMES } from "#src/utils/constants";

export async function signInController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = req.body as SignInInput;
    const result = await signInService(input, {
      ip: req.ip,
      ua: req.headers["user-agent"],
    });

    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    res.sendResponse(
      200,
      {
        userId: result.userId,
        result,
      },
      "Signed in successfully",
    );
  } catch (err) {
    next(err);
  }
}
