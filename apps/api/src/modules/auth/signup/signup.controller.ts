import type { Request, Response, NextFunction } from "express";
import type { SignUpInput } from "./signUp.validation";
import { signUpService } from "./signUp.service";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "#src/utils/cookieHandler";

export async function signUpController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = req.body as SignUpInput;
    const result = await signUpService(input, {
      ip: req.ip,
      ua: req.headers["user-agent"],
    });

    if (result.alreadyExists) {
      // OWASP: Return 201 to prevent enumeration
      res.sendResponse(
        201,
        null,
        "If this email is not registered, an account will be created.",
      );
    }

    if ("accessToken" in result) {
      setAccessTokenCookie(res, result.accessToken);
      setRefreshTokenCookie(res, result.refreshToken);
    }

    res.sendResponse(
      201,
      {
        userId: result.userId,
        result,
      },
      "Account created successfully",
    );
  } catch (err) {
    next(err);
  }
}
