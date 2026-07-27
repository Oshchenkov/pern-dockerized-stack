// src/utils/constants.ts
export const COOKIE_NAMES = {
  ACCESS_TOKEN: "__Host-at",
  REFRESH_TOKEN: "__Host-rt",
} as const;

export const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;

export const DENYLIST_PREFIX = "denylist:jti:";
export const RATE_LIMIT_PREFIX = "rl:";

// Refresh token rotation: reuse detection window
export const SESSION_REUSE_WINDOW_MS = 30_000; // 30s grace for concurrent requests
