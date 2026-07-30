export const COOKIE_NAMES = {
  ACCESS_TOKEN: "__Host-Http-at",
  REFRESH_TOKEN: "__Secure-rt",
} as const;

export const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;

export const DENYLIST_PREFIX = "denylist:jti:";
export const RATE_LIMIT_PREFIX = "rl:";
