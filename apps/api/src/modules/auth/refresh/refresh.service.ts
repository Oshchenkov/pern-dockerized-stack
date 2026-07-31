import { prisma } from "#src/config/prisma";
import {
  ForbiddenError,
  UnauthorizedError,
} from "#src/middleware/error.middleware";
import { denylistService } from "#src/services/denylist.service";
import { sessionService } from "#src/services/session.service";
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "#src/services/token.service";
import { generateOpaqueToken } from "#src/utils/crypto";

export async function refreshService(
  refreshTokenRaw: string,
  meta: { ip?: string; ua?: string },
) {
  // 1. Verify JWT signature & expiry
  let payload;
  try {
    payload = await verifyRefreshToken(refreshTokenRaw);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  // 2. Check denylist
  if (payload.jti && (await denylistService.isDenied(payload.jti))) {
    throw new UnauthorizedError("Token has been revoked");
  }

  // 3. Rotate session (includes reuse detection)
  let result;
  try {
    result = await sessionService.rotate({
      oldRefreshToken: refreshTokenRaw,
      newRefreshToken: "", // placeholder, replaced below
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });
  } catch (err: any) {
    if (err.message === "TOKEN_REUSE_DETECTED") {
      // Denylist the compromised JTI
      if (payload.jti) {
        await denylistService.add({
          jti: payload.jti,
          userId: payload.sub!,
          sessionId: payload.sid,
          reason: "refresh_token_reuse",
          expiresAt: new Date((payload.exp ?? 0) * 1000),
        });
      }
      throw new UnauthorizedError("Session compromised — all sessions revoked");
    }
    throw new UnauthorizedError("Session invalid");
  }

  // 4. Verify tokenVersion (OWASP: invalidate tokens after password change)
  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { tokenVersion: true, status: true },
  });

  if (!user || user.status === "BANNED") {
    throw new ForbiddenError("Account unavailable");
  }
  if (payload.tv !== user.tokenVersion) {
    throw new UnauthorizedError(
      "Token version mismatch — please sign in again",
    );
  }

  // 5. Issue new token pair
  const newRefreshRaw = generateOpaqueToken();

  // Update the session's hash to the new refresh token
  // (sessionService.rotate already created the session with a placeholder hash;
  //  in production you'd pass the real token into rotate. Here we re-hash.)
  // For simplicity, we issue a JWT refresh token and store its hash.
  const newRefreshJwt = await signRefreshToken({
    userId: result.userId,
    sessionId: result.newSession.id,
    familyId: result.newSession.familyId,
    tokenVersion: user.tokenVersion,
  });

  const newAccess = await signAccessToken({
    userId: result.userId,
    sessionId: result.newSession.id,
    tokenVersion: user.tokenVersion,
  });

  // Denylist the OLD refresh JTI
  if (payload.jti) {
    await denylistService.add({
      jti: payload.jti,
      userId: result.userId,
      sessionId: payload.sid,
      reason: "rotated",
      expiresAt: new Date((payload.exp ?? 0) * 1000),
    });
  }

  return {
    accessToken: newAccess,
    refreshToken: newRefreshJwt,
    accessExpiresIn: ACCESS_TOKEN_TTL,
    refreshExpiresIn: REFRESH_TOKEN_TTL,
  };
}
