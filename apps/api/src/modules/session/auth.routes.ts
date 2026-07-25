// src/routes/auth.routes.ts
import { Router } from "express";
import cookieParser from "cookie-parser";
import { loginPassword } from "../services/password.service";
import { refreshSession, logout } from "../services/session.service";
import { verifyAccessToken } from "../lib/jwt";

const router = Router();

router.use(cookieParser());

const REFRESH_COOKIE = "refresh_token";

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await loginPassword({
      email,
      password,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/auth/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    return res.json({
      accessToken: result.accessToken,
      accessExpiresIn: result.accessExpiresIn,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      return res.status(401).json({ error: "missing_refresh_token" });
    }

    const result = await refreshSession(refreshToken, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/auth/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 14,
    });

    return res.json({
      accessToken: result.accessToken,
      accessExpiresIn: result.accessExpiresIn,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    let accessJti: string | undefined;
    let accessSid: string | undefined;
    let accessExp: number | undefined;
    let userId: string | undefined;

    const authHeader = req.headers.authorization || "";

    if (authHeader.startsWith("Bearer ")) {
      try {
        const payload = await verifyAccessToken(authHeader.slice(7));
        accessJti = payload.jti;
        accessSid = payload.sid;
        accessExp = payload.exp;
        userId = payload.sub;
      } catch {
        // Ignore invalid access token during logout.
      }
    }

    await logout({
      refreshToken,
      accessJti,
      accessSid,
      accessExp,
      userId,
    });

    res.clearCookie(REFRESH_COOKIE, {
      path: "/auth/refresh",
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
