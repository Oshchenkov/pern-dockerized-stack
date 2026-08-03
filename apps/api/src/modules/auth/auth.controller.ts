// src/modules/auth/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { verifyAccessToken } from "#src/services/token.service";
import { denylistService } from "#src/services/denylist.service";
import { COOKIE_NAMES } from "#src/utils/constants";
import { env } from "#src/config/env";
import { UnauthorizedError } from "#src/middleware/error.middleware";
import type { SignUpInput, SignInInput } from "./auth.schema";

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "strict" as const,
  path: "/",
};

export const authController = {
  // ─── POST /auth/signup ──────────────────────────────────────────────────
  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as SignUpInput;
      const result = await authService.signUp(input, {
        ip: req.ip,
        ua: req.headers["user-agent"],
      });

      if (result.alreadyExists) {
        // OWASP: Return 201 to prevent enumeration
        return res.status(201).json({
          message:
            "If this email is not registered, an account will be created.",
        });
      }

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

      return res.status(201).json({
        message: "Account created successfully",
        userId: result.userId,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /auth/signin ──────────────────────────────────────────────────
  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as SignInInput;
      const result = await authService.signIn(input, {
        ip: req.ip,
        ua: req.headers["user-agent"],
      });

      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
        ...cookieOptions,
        maxAge: result.accessExpiresIn * 1000,
      });
      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, {
        ...cookieOptions,
        maxAge: result.refreshExpiresIn * 1000,
        path: "/auth/refresh",
      });

      return res.status(200).json({
        message: "Signed in successfully",
        userId: result.userId,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /auth/refresh ─────────────────────────────────────────────────
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
      if (!refreshToken) {
        throw new UnauthorizedError("Refresh token missing");
      }

      const result = await authService.refresh(refreshToken, {
        ip: req.ip,
        ua: req.headers["user-agent"],
      });

      // Clear old cookies, set new
      res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, cookieOptions);
      res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
        ...cookieOptions,
        path: "/auth/refresh",
      });

      res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
        ...cookieOptions,
        maxAge: result.accessExpiresIn * 1000,
      });
      res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, {
        ...cookieOptions,
        maxAge: result.refreshExpiresIn * 1000,
        path: "/auth/refresh",
      });

      return res.status(200).json({ message: "Token refreshed" });
    } catch (err) {
      next(err);
    }
  },

  // ─── POST /auth/logout ──────────────────────────────────────────────────
  async logout(req: Request, res: Response, next: NextFunction) {
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
        await authService.logout(refreshToken, accessJti, userId);
      }

      res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, cookieOptions);
      res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
        ...cookieOptions,
        path: "/auth/refresh",
      });

      return res.status(200).json({ message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },

  // ─── GET /auth/me  (protected — verifies access token) ──────────────────
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user is set by authenticate middleware
      const user = await (
        await import("#src/config/prisma")
      ).prisma.user.findUnique({
        where: { id: (req as any).user.sub },
        select: {
          id: true,
          primaryEmail: true,
          primaryEmailVerified: true,
          status: true,
          createdAt: true,
          profile: { select: { name: true, surname: true, avatarUrl: true } },
        },
      });

      if (!user) throw new UnauthorizedError("User not found");

      return res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  },
};
