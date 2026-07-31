import { env } from "#src/config/env";
import type { Response, CookieOptions } from "express";
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from "#src/services/token.service";
import { COOKIE_NAMES } from "./constants";

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // block browser js access
  secure: env.COOKIE_SECURE, // HTTPS only
  sameSite: "strict" as const,
  path: "/",
};

export function setCookie(
  res: Response,
  name: string,
  value: string,
  overrides: Partial<CookieOptions> = {},
): void {
  res.cookie(name, value, { ...BASE_COOKIE_OPTIONS, ...overrides });
}

export function clearCookie(
  res: Response,
  name: string,
  overrides: Partial<CookieOptions> = {},
): void {
  res.cookie(name, "", { ...BASE_COOKIE_OPTIONS, ...overrides, maxAge: 0 });
}

export function setAccessTokenCookie(res: Response, token: string) {
  setCookie(res, COOKIE_NAMES.ACCESS_TOKEN, token, {
    maxAge: ACCESS_TOKEN_TTL * 1000,
  });
}

export function setRefreshTokenCookie(res: Response, token: string) {
  setCookie(res, COOKIE_NAMES.REFRESH_TOKEN, token, {
    maxAge: REFRESH_TOKEN_TTL * 1000,
    path: "/auth/refresh",
  });
}

export function clearAccessTokenCookie(res: Response) {
  clearCookie(res, COOKIE_NAMES.ACCESS_TOKEN);
}

export function clearRefreshTokenCookie(res: Response) {
  clearCookie(res, COOKIE_NAMES.REFRESH_TOKEN, { path: "/auth/refresh" });
}
