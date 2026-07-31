import { NextFunction, Request, Response } from "express";
import { SignInInput } from "./signIn.validation";
import { signInService } from "./signIn.service";
import { setCookie } from "#src/utils/cookieHandler";
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

    setCookie(res, COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
      maxAge: result.accessExpiresIn * 1000,
    });

    setCookie(res, COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, {
      maxAge: result.refreshExpiresIn * 1000,
      path: "/auth/refresh",
    });

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
