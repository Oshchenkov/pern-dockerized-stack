import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";

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
  - iat: issued at timestamp
  - exp: expiration timestamp

Refresh Token:
- opaque random token
- lifetime: 7–30 days
- stored in PostgreSQL as SHA-256 hash
- rotated on every refresh
- stored in HttpOnly Secure SameSite cookie for browser apps
*/

const alg = "HS256";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const issuer = process.env.JWT_ISSUER!;
const audience = process.env.JWT_AUDIENCE!;

export const ACCESS_TOKEN_TTL_SECONDS = Number(
  process.env.ACCESS_TOKEN_TTL_SECONDS || 900,
);

export type AccessTokenPayload = {
  sub: string;
  jti: string;
  sid: string;
  tv: number;
  amr: string[];
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};

export async function issueAccessToken(input: {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  amr: string[];
}) {
  const jti = randomUUID();

  const token = await new SignJWT({
    sid: input.sessionId,
    tv: input.tokenVersion,
    amr: input.amr,
  })
    .setProtectedHeader({ alg, typ: "JWT" })
    .setSubject(input.userId)
    .setJti(jti)
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);

  return { token, jti };
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: [alg],
    issuer,
    audience,
    clockTolerance: 30,
  });

  return payload as AccessTokenPayload;
}
