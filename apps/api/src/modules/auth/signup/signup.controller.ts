// Handles HTTP requests
// src/modules/auth/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAMES } from "#src/utils/constants";
import type { SignUpInput } from "./signUp.validation";
import { signUpService } from "./signUp.service";
import { logger } from "#src/config/logger";
import { setCookie } from "#src/utils/cookieHandler";

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

    // logger.warn({ result }, "SIGN UP");

    if (result.alreadyExists) {
      // OWASP: Return 201 to prevent enumeration
      res.sendResponse(
        201,
        null,
        "If this email is not registered, an account will be created.",
      );
    }

    if ("accessToken" in result) {
      setCookie(res, COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
        maxAge: result.accessExpiresIn * 1000,
      });

      setCookie(res, COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, {
        maxAge: result.refreshExpiresIn * 1000,
        path: "/auth/refresh",
      });
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
