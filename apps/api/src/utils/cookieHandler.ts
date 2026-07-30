import { env } from "#src/config/env";
import type { Response, CookieOptions } from "express";

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

// function createCookieSetter(res: Response) {
//   const setCookie = (
//     name: string,
//     value: string,
//     overrides: Partial<CookieOptions> = {},
//   ): void => {
//     res.cookie(name, value, { ...BASE_COOKIE_OPTIONS, ...overrides });
//   };

//   const clearCookie = (
//     name: string,
//     overrides: Partial<CookieOptions> = {},
//   ): void => {
//     // maxAge: 0 + empty value tells the browser to expire it immediately
//     res.cookie(name, "", { ...BASE_COOKIE_OPTIONS, ...overrides, maxAge: 0 });
//   };

//   return { setCookie, clearCookie };
// }
