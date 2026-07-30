// Handles HTTP requests
// src/modules/auth/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAMES } from "#src/utils/constants";
import { env } from "#src/config/env";
import type { SignUpInput } from "./signup.validation";
import { signUpService } from "./signup.service";
import { logger } from "#src/config/logger";

const cookieOptions = {
  httpOnly: true, // block browser js access
  secure: env.COOKIE_SECURE, // HTTPS only
  sameSite: "strict" as const,
  path: "/",
};

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
      // Set cookies
      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
        ...cookieOptions,
        maxAge: result.accessExpiresIn * 1000,
      });
      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, {
        ...cookieOptions,
        maxAge: result.refreshExpiresIn * 1000,
        path: "/auth/refresh", // restrict refresh cookie path (OWASP)
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
