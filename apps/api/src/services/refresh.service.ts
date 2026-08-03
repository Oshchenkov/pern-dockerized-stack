import { randomUUID } from "node:crypto";
import { logger } from "#src/config/logger";
import { prisma } from "#src/config/prisma";
import {
  ForbiddenError,
  UnauthorizedError,
} from "#src/middleware/error.middleware";
import { denylistService } from "#src/services/denylist.service";
import {
  SessionNotFoundError,
  SessionInactiveError,
  SessionExpiredError,
  TokenReuseDetectedError,
} from "#src/middleware/error.middleware";
import { sessionService } from "#src/services/session.service";
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type RefreshTokenPayload,
} from "#src/services/token.service";
import { hashToken } from "#src/utils/crypto";

export async function refreshService(
  refreshTokenRaw: string,
  meta: { ip?: string; ua?: string },
) {
  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1 — Lightweight validation (NO heavy crypto)
  // ═══════════════════════════════════════════════════════════════════════

  // 1a. Verify JWT signature + expiry (symmetric HMAC — fast)
  let payload: RefreshTokenPayload;
  try {
    payload = await verifyRefreshToken(refreshTokenRaw);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const userId = payload.sub!;

  // 1b. Denylist check (Redis — sub-millisecond)
  if (payload.jti && (await denylistService.isDenied(payload.jti))) {
    throw new UnauthorizedError("Token has been revoked");
  }

  // 1c. DB session lookup + status check (BEFORE any signing)
  //     This is the DDoS fix: revoked / missing / expired sessions
  //     are rejected here without wasting CPU on signAccessToken etc.
  const oldHash = hashToken(refreshTokenRaw); // SHA-256 — negligible cost

  let oldSession;
  try {
    oldSession = await sessionService.preValidate(oldHash);
  } catch (err) {
    if (err instanceof TokenReuseDetectedError) {
      // Denylist the compromised JTI
      if (payload.jti) {
        await denylistService.add({
          jti: payload.jti,
          userId,
          sessionId: payload.sid,
          reason: "refresh_token_reuse",
          expiresAt: new Date((payload.exp ?? 0) * 1000),
        });
      }
      throw new UnauthorizedError("Session compromised — all sessions revoked");
    }
    if (
      err instanceof SessionNotFoundError ||
      err instanceof SessionInactiveError ||
      err instanceof SessionExpiredError
    ) {
      throw new UnauthorizedError("Session invalid");
    }
    throw err;
  }

  // 1d. User status + tokenVersion
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2 — Heavy crypto (only reached if ALL validation passed)
  // ═══════════════════════════════════════════════════════════════════════

  const newSessionId = randomUUID();

  const newRefreshJwt = await signRefreshToken({
    userId,
    sessionId: newSessionId,
    familyId: oldSession.familyId,
    tokenVersion: user.tokenVersion,
  });

  const newAccessJwt = await signAccessToken({
    userId,
    sessionId: newSessionId,
    tokenVersion: user.tokenVersion,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3 — Atomic DB rotation (row-locked transaction)
  // ═══════════════════════════════════════════════════════════════════════

  let result;
  try {
    result = await sessionService.rotate({
      oldRefreshTokenHash: oldHash,
      newRefreshTokenHash: hashToken(newRefreshJwt),
      newSessionId,
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });
  } catch (err) {
    // Race condition: another request rotated between Phase 1 and Phase 3.
    // The FOR UPDATE lock + Serializable isolation will surface this.
    if (err instanceof TokenReuseDetectedError) {
      if (payload.jti) {
        await denylistService.add({
          jti: payload.jti,
          userId,
          sessionId: payload.sid,
          reason: "refresh_token_reuse",
          expiresAt: new Date((payload.exp ?? 0) * 1000),
        });
      }
      throw new UnauthorizedError("Session compromised — all sessions revoked");
    }
    if (
      err instanceof SessionNotFoundError ||
      err instanceof SessionInactiveError ||
      err instanceof SessionExpiredError
    ) {
      throw new UnauthorizedError("Session invalid");
    }
    throw err;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 4 — Denylist old JTI + respond
  // ═══════════════════════════════════════════════════════════════════════

  if (payload.jti) {
    await denylistService.add({
      jti: payload.jti,
      userId,
      sessionId: payload.sid,
      reason: "rotated",
      expiresAt: new Date((payload.exp ?? 0) * 1000),
    });
  }

  if (result.wasRetry) {
    logger.info({ userId, newSessionId }, "Leeway retry — tokens re-issued");
  } else {
    logger.debug({ userId, newSessionId }, "Tokens refreshed");
  }

  return {
    accessToken: newAccessJwt,
    refreshToken: newRefreshJwt,
    accessExpiresIn: ACCESS_TOKEN_TTL,
    refreshExpiresIn: REFRESH_TOKEN_TTL,
  };
}
