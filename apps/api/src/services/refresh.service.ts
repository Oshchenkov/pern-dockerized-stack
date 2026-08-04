import { randomUUID } from "node:crypto";
import { logger } from "#src/config/logger";
import { prisma } from "#src/config/prisma";
import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
  SessionNotFoundError,
  SessionInactiveError,
  SessionExpiredError,
  TokenReuseDetectedError,
} from "#src/middleware/error.middleware";
import { denylistService } from "#src/services/denylist.service";
import { sessionService } from "#src/services/session.service";
import {
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
  // ═══════════════════════════════════════════════════════════════════
  // PHASE 1 — Lightweight validation (NO heavy crypto)
  // ═══════════════════════════════════════════════════════════════════

  // 1a. Verify JWT signature + expiry
  let payload: RefreshTokenPayload;
  try {
    payload = await verifyRefreshToken(refreshTokenRaw);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const userId = payload.sub!;

  // 1b. Denylist check — ONLY catches explicit revocations
  //     (signout, admin, reuse). "rotated" tokens are NOT here.
  if (payload.jti && (await denylistService.isDenied(payload.jti))) {
    throw new UnauthorizedError("Token has been revoked");
  }

  // 1c. Session lookup + replay detection + leeway window
  //     This is where family revocation happens.
  const oldHash = hashToken(refreshTokenRaw);

  let oldSession;
  try {
    oldSession = await sessionService.preValidate(oldHash);
  } catch (err) {
    if (err instanceof TokenReuseDetectedError) {
      // Denylist the compromised JTI so future replays
      // are caught at step 1b (Redis fast-path)
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

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 2 — Heavy crypto (only reached if ALL validation passed)
  // ═══════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 3 — Atomic DB rotation (row-locked transaction)
  // ═══════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 4 — Log + respond
  // ═══════════════════════════════════════════════════════════════════
  //
  //  NOTE: We do NOT denylist the old JTI here.
  //  The old session is now REVOKED in the DB.
  //  If someone replays the old token, sessionService.preValidate()
  //  will detect it and either:
  //    • allow it (leeway window) → rotate from replacement
  //    • reject it + revoke family (replay attack)

  if (result.wasRetry) {
    logger.info({ userId, newSessionId }, "Leeway retry — tokens re-issued");
  } else {
    logger.debug({ userId, newSessionId }, "Tokens refreshed");
  }

  return {
    accessToken: newAccessJwt,
    refreshToken: newRefreshJwt,
  };
}

/*

SCENARIO 1: Normal refresh
──────────────────────────
  Token ACTIVE in DB
  → denylist miss
  → preValidate: ACTIVE ✓
  → sign new tokens
  → rotate: old → REVOKED, new → ACTIVE
  → return new tokens
  → old token NOT denylisted


SCENARIO 2: Legitimate retry within 10s (network lag)
──────────────────────────────────────────────────────
  Old token REVOKED in DB, revokedAt = 3s ago
  → denylist miss (not denylisted)
  → preValidate: REVOKED, 3s < 10s, replacedBy exists → LEEWAY
  → sign new tokens
  → rotate: replacement → REVOKED, new → ACTIVE
  → return new tokens ✓


SCENARIO 3: Replay attack (stolen token, > 10s)
────────────────────────────────────────────────
  Old token REVOKED in DB, revokedAt = 47s ago
  → denylist miss (not denylisted)
  → preValidate: REVOKED, 47s > 10s → REPLAY
  → revokeFamily(familyId) ← ALL sessions in family die
  → denylist.add(jti, reason: "refresh_token_reuse")
  → throw 401 "Session compromised" ✓


SCENARIO 4: Replaying a token after signout
──────────────────────────────────────────
  Token was denylisted during signout (reason: "signout")
  → denylist HIT at step 1b
  → throw 401 "Token has been revoked" ✓
  → No family revocation needed (signout already revoked session)


SCENARIO 5: Replaying after reuse was already detected
──────────────────────────────────────────────────────
  Token was denylisted during previous reuse detection
  → denylist HIT at step 1b
  → throw 401 "Token has been revoked" ✓
  → Family was already revoked on first detection

*/
