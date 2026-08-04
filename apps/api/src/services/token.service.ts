import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "#src/config/env";
import { generateJti } from "#src/utils/crypto";
import { TOKEN_TYPES } from "#src/utils/constants";

/*
Access Token:
- JWT
- lifetime: 5–15 minutes
- stored in memory for SPA/mobile, or HttpOnly cookie if using BFF
- contains:
  - sub: user id
  - jti: unique token id
  - sid: session id
  - tv: token version
  - amr: authentication method, example: pwd, google, github
  - iss: Issuer
  - aud: Audience
  - iat: issued at timestamp
  - exp: expiration timestamp

Refresh Token:
- opaque random token
- lifetime: 7–30 days
- stored in PostgreSQL as SHA-256 hash
- rotated on every refresh
- stored in HttpOnly Secure SameSite cookie for browser apps
*/

export interface AccessTokenBasePayload extends JWTPayload {
  sub: string;
  jti: string;
  sid: string;
  tv: number;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AccessTokenPayload extends AccessTokenBasePayload {
  amr: string[];
  type: typeof TOKEN_TYPES.ACCESS;
}

export interface RefreshTokenPayload extends AccessTokenBasePayload {
  fid: string; // familyId
  type: typeof TOKEN_TYPES.REFRESH;
}

const alg = "HS256";
const issuer = env.JWT_ISSUER;
const audience = env.JWT_AUDIENCE;
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
export const ACCESS_TOKEN_TTL = env.ACCESS_TOKEN_TTL_SECONDS;
export const REFRESH_TOKEN_TTL = env.REFRESH_TOKEN_TTL_SECONDS;

export async function signAccessToken(params: {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  amr?: string[];
}): Promise<string> {
  const jti = generateJti();
  return new SignJWT({
    sid: params.sessionId,
    tv: params.tokenVersion,
    type: TOKEN_TYPES.ACCESS,
    amr: params.amr,
  })
    .setProtectedHeader({ alg, typ: "JWT" })
    .setSubject(params.userId)
    .setJti(jti)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(accessSecret);
}

export async function signRefreshToken(params: {
  userId: string;
  sessionId: string;
  familyId: string;
  tokenVersion: number;
}): Promise<string> {
  const jti = generateJti();
  return new SignJWT({
    sid: params.sessionId,
    fid: params.familyId,
    tv: params.tokenVersion,
    type: TOKEN_TYPES.REFRESH,
  })
    .setProtectedHeader({ alg, typ: "JWT" })
    .setSubject(params.userId)
    .setJti(jti)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL}s`)
    .sign(refreshSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    algorithms: [alg],
    issuer,
    audience,
  });
  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret, {
    algorithms: [alg],
    issuer,
    audience,
    clockTolerance: 30,
  });
  return payload as RefreshTokenPayload;
}
