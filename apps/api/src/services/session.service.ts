import { randomUUID } from "node:crypto";
import { prisma } from "#src/config/prisma";
import { logger } from "#src/config/logger";
import { hashToken } from "#src/utils/crypto";
import {
  signAccessToken,
  signRefreshToken,
  REFRESH_TOKEN_TTL,
} from "#src/services/token.service";
import {
  RevokedReason,
  UserStatus,
  SessionStatus,
} from "#root/prisma/generated/prisma/enums";
import {
  SessionNotFoundError,
  SessionInactiveError,
  SessionExpiredError,
  TokenReuseDetectedError,
} from "#src/middleware/error.middleware";

// ─── Configuration ────────────────────────────────────────────────────────

/**
 * Grace window for legitimate network retries (mobile, flaky connections).
 * If a revoked token is replayed WITHIN this window and has a `replacedBy`
 * pointer, we treat it as a retry — NOT an attack.
 */
const REUSE_LEEWAY_MS = 10_000; // 10 seconds

// ─── Return type ──────────────────────────────────────────────────────────

export interface RotateResult {
  newSessionId: string;
  familyId: string;
  userId: string;
  /** true when the request was a legitimate network retry (leeway window) */
  wasRetry: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────

export const sessionService = {
  // ──────────────────────────────────────────────────────────────────────
  // CREATE  (sign-up / sign-in)
  // ──────────────────────────────────────────────────────────────────────
  async create(params: {
    sessionId: string;
    familyId: string;
    userId: string;
    refreshTokenHash: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.userSession.create({
      data: {
        id: params.sessionId,
        familyId: params.familyId,
        userId: params.userId,
        refreshTokenHash: params.refreshTokenHash,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
        status: UserStatus.ACTIVE,
      },
    });
  },

  // ──────────────────────────────────────────────────────────────────────
  // PRE-VALIDATE  (lightweight read BEFORE any crypto)
  //
  // Called by refresh.service BEFORE signing new tokens.
  // Fails fast on: missing session, expired, banned, obvious replay.
  // Returns the old session so the caller can extract familyId etc.
  // ──────────────────────────────────────────────────────────────────────
  async preValidate(oldRefreshTokenHash: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenHash: oldRefreshTokenHash },
    });

    if (!session) {
      throw new SessionNotFoundError();
    }

    // Hard replay: revoked OUTSIDE the leeway window → attack
    if (session.status === SessionStatus.REVOKED) {
      const revokedAt = session.revokedAt?.getTime() ?? 0;
      const elapsed = Date.now() - revokedAt;

      const withinLeeway =
        elapsed <= REUSE_LEEWAY_MS && session.replacedBy !== null;

      if (!withinLeeway) {
        // ── BLAST RADIUS: revoke the entire family ──
        logger.warn(
          {
            sessionId: session.id,
            familyId: session.familyId,
            userId: session.userId,
            elapsedMs: elapsed,
          },
          "Refresh token REPLAY detected — revoking entire family",
        );

        await this.revokeFamily(session.familyId, RevokedReason.REPLAY_ATTACK);
        throw new TokenReuseDetectedError(session.familyId, session.userId);
      }

      // Within leeway → signal retry to caller (handled in rotate)
    }

    if (
      session.status !== "ACTIVE" &&
      session.status !== SessionStatus.REVOKED
    ) {
      throw new SessionInactiveError();
    }

    if (session.expiresAt < new Date()) {
      await prisma.userSession.updateMany({
        where: { id: session.id, status: "ACTIVE" },
        data: {
          status: SessionStatus.REVOKED,
          revokedAt: new Date(),
          revokedReason: RevokedReason.EXPIRED,
        },
      });
      throw new SessionExpiredError();
    }

    return session;
  },

  // ──────────────────────────────────────────────────────────────────────
  // ROTATE  (atomic transaction with row-level lock)
  //
  // Called AFTER the caller has signed new tokens.
  // Handles both the normal path and the leeway-retry path.
  // ──────────────────────────────────────────────────────────────────────
  async rotate(params: {
    oldRefreshTokenHash: string;
    newRefreshTokenHash: string;
    newSessionId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RotateResult> {
    return prisma.$transaction(
      async (tx) => {
        // ── 1. Lock the old session row (SELECT … FOR UPDATE) ──
        //    Prevents two concurrent requests from both passing validation.
        const locked: Array<{
          id: string;
          family_id: string;
          user_id: string;
          status: string;
          revoked_at: Date | null;
          replaced_by: string | null;
          ip_address: string | null;
          user_agent: string | null;
        }> = await tx.$queryRaw`
          SELECT id, family_id, user_id, status,
                 revoked_at, replaced_by,
                 ip_address, user_agent
          FROM user_sessions
          WHERE refresh_token_hash = ${params.oldRefreshTokenHash}
          FOR UPDATE
        `;

        const old = locked[0];
        if (!old) throw new SessionNotFoundError();

        // ── 2. Replay / leeway handling ──
        if (old.status === SessionStatus.REVOKED) {
          const elapsed = Date.now() - (old.revoked_at?.getTime() ?? 0);
          const withinLeeway =
            elapsed <= REUSE_LEEWAY_MS && old.replaced_by !== null;

          if (!withinLeeway) {
            // ATTACK — revoke entire family inside the same tx
            await tx.userSession.updateMany({
              where: { familyId: old.family_id },
              data: {
                status: SessionStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: RevokedReason.REPLAY_ATTACK,
              },
            });
            throw new TokenReuseDetectedError(old.family_id, old.user_id);
          }

          // ── LEEWAY RETRY ──
          // The previous rotation succeeded but the client lost the response.
          // Rotate forward from the REPLACEMENT session, not the dead one.
          const replacement = await tx.userSession.findUnique({
            where: { id: old.replaced_by! },
          });

          if (!replacement || replacement.status !== "ACTIVE") {
            // Replacement already gone → treat as attack
            await tx.userSession.updateMany({
              where: { familyId: old.family_id },
              data: {
                status: SessionStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: RevokedReason.REPLAY_ATTACK,
              },
            });
            throw new TokenReuseDetectedError(old.family_id, old.user_id);
          }

          // Revoke the replacement, create a fresh session
          await tx.userSession.update({
            where: { id: replacement.id },
            data: {
              status: SessionStatus.REVOKED,
              revokedAt: new Date(),
              revokedReason: RevokedReason.ROTATED,
              replacedBy: params.newSessionId,
            },
          });

          const newSession = await tx.userSession.create({
            data: {
              id: params.newSessionId,
              familyId: old.family_id,
              userId: old.user_id,
              refreshTokenHash: params.newRefreshTokenHash,
              ipAddress: params.ipAddress ?? replacement.ipAddress,
              userAgent: params.userAgent ?? replacement.userAgent,
              expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
              status: SessionStatus.ACTIVE,
            },
          });

          logger.info(
            {
              sessionId: old.id,
              replacedBy: replacement.id,
              userId: old.user_id,
            },
            "Leeway retry — rotated from replacement session",
          );

          return {
            newSessionId: newSession.id,
            familyId: old.family_id,
            userId: old.user_id,
            wasRetry: true,
          };
        }

        // ── 3. Guard: must be ACTIVE ──
        if (old.status !== SessionStatus.ACTIVE) {
          throw new SessionInactiveError();
        }

        // ── 4. Normal rotation ──
        await tx.userSession.update({
          where: { id: old.id },
          data: {
            status: SessionStatus.REVOKED,
            revokedAt: new Date(),
            revokedReason: RevokedReason.ROTATED,
            replacedBy: params.newSessionId,
          },
        });

        const newSession = await tx.userSession.create({
          data: {
            id: params.newSessionId,
            familyId: old.family_id,
            userId: old.user_id,
            refreshTokenHash: params.newRefreshTokenHash,
            ipAddress: params.ipAddress ?? old.ip_address,
            userAgent: params.userAgent ?? old.user_agent,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
            status: SessionStatus.ACTIVE,
          },
        });

        return {
          newSessionId: newSession.id,
          familyId: old.family_id,
          userId: old.user_id,
          wasRetry: false,
        };
      },
      {
        // Serializable isolation prevents phantom reads during rotation
        isolationLevel: "Serializable",
        timeout: 5_000,
      },
    );
  },

  // ──────────────────────────────────────────────────────────────────────
  // REVOKE helpers
  // ──────────────────────────────────────────────────────────────────────

  /** Revoke every session in a family (replay attack / device logout). */
  async revokeFamily(
    familyId: string,
    reason: RevokedReason = RevokedReason.EXPIRED,
  ): Promise<number> {
    const { count } = await prisma.userSession.updateMany({
      where: { familyId, status: SessionStatus.ACTIVE },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
    return count;
  },

  /** Revoke a single session (normal logout). */
  async revoke(
    sessionId: string,
    reason: RevokedReason = RevokedReason.LOGOUT,
  ): Promise<void> {
    await prisma.userSession.updateMany({
      where: { id: sessionId, status: SessionStatus.ACTIVE },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  },

  /** Revoke ALL sessions for a user (password change, admin ban). */
  async revokeAllForUser(
    userId: string,
    reason: RevokedReason = RevokedReason.ADMIN,
  ): Promise<number> {
    const { count } = await prisma.userSession.updateMany({
      where: { userId, status: SessionStatus.ACTIVE },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
    return count;
  },

  /** Liveness check for the authenticate middleware. */
  async isActive(sessionId: string): Promise<boolean> {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { status: true, expiresAt: true },
    });
    if (!session) return false;
    return (
      session.status === SessionStatus.ACTIVE && session.expiresAt > new Date()
    );
  },

  /** Cron: purge expired rows. */
  async purgeExpired(): Promise<number> {
    const { count } = await prisma.userSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) logger.info({ count }, "Purged expired sessions");
    return count;
  },
};

// ─── Token issuance (sign-up / sign-in) ───────────────────────────────────

export async function issueTokens(
  userId: string,
  tokenVersion: number,
  meta: { ip?: string; ua?: string },
) {
  const sessionId = randomUUID();
  const familyId = randomUUID();

  const refreshToken = await signRefreshToken({
    userId,
    sessionId,
    familyId,
    tokenVersion,
  });

  const accessToken = await signAccessToken({
    userId,
    sessionId,
    tokenVersion,
  });

  await sessionService.create({
    sessionId,
    familyId,
    userId,
    refreshTokenHash: hashToken(refreshToken),
    ipAddress: meta.ip,
    userAgent: meta.ua,
  });

  return {
    accessToken,
    refreshToken,
  };
}

/*

Execution order
────────────────
  PHASE 1 — fail fast, no heavy crypto
  ┌─────────────────────────────────────────────────┐
  │ verifyRefreshToken()        ← HMAC verify, fast │
  │ denylist.isDenied()         ← Redis GET         │
  │ hashToken(old)              ← SHA-256, ~0.01 ms │
  │ sessionService.preValidate()← DB read           │
  │  └ REVOKED + outside leeway → revokeFamily → 401│
  │  └ REVOKED + within leeway  → flag as retry     │
  │  └ NOT FOUND / EXPIRED      → 401               │
  │ prisma.user.findUnique()    ← tokenVersion check│
  └─────────────────────────────────────────────────┘
  ↓ (only if everything passed)

  PHASE 2 — heavy crypto
  ┌─────────────────────────────────────────────────┐
  │ signRefreshToken()          ← HS256 sign        │
  │ signAccessToken()           ← HS256 sign        │
  └─────────────────────────────────────────────────┘
  ↓

  PHASE 3 — atomic DB write
  ┌─────────────────────────────────────────────────┐
  │ $transaction(Serializable)                      │
  │   SELECT … FOR UPDATE   ← row lock             │
  │   if REVOKED again → leeway or blast radius     │
  │   UPDATE old → REVOKED, replacedBy              │
  │   INSERT new session                            │
  └─────────────────────────────────────────────────┘
  ↓

  PHASE 4 — cleanup
  ┌─────────────────────────────────────────────────┐
  │ denylist.add(old jti)                           │
  │ return { accessToken, refreshToken }            │
  └─────────────────────────────────────────────────┘

  ---------------------------------------------------

LEGITIMATE NETWORK RETRY (within 10 s)
═══════════════════════════════════════

Client                    Server                     DB
  │                         │                         │
  │── POST /auth/refresh ──►│                         │
  │   (oldRefreshJwt)       │── preValidate(hash) ──► │
  │                         │◄── session ACTIVE ───── │
  │                         │── sign new tokens       │
  │                         │── rotate() ───────────► │
  │                         │   UPDATE old→REVOKED    │
  │                         │   INSERT new (id=X)     │
  │                         │◄─────────────────────── │
  │   ✗ network drop ✗      │                         │
  │   (never receives X)    │                         │
  │                         │                         │
  │── POST /auth/refresh ──►│  (retry, same old JWT)  │
  │   (oldRefreshJwt)       │── preValidate(hash) ──► │
  │                         │◄── REVOKED, 3 s ago ──  │
  │                         │   replacedBy = X        │
  │                         │   3 s < 10 s → RETRY    │
  │                         │── sign new tokens       │
  │                         │── rotate() ───────────► │
  │                         │   FOR UPDATE old row    │
  │                         │   leeway → find X       │
  │                         │   UPDATE X → REVOKED    │
  │                         │   INSERT Y              │
  │                         │◄─────────────────────── │
  │◄── 200 { new tokens } ──│                         │
  │   (session Y)           │                         │


ATTACK (outside 10 s)
═════════════════════

Attacker                  Server                     DB
  │                         │                         │
  │── POST /auth/refresh ──►│                         │
  │   (stolen old JWT)      │── preValidate(hash) ──► │
  │                         │◄── REVOKED, 47 s ago ─  │
  │                         │   47 s > 10 s → ATTACK  │
  │                         │── revokeFamily() ─────► │
  │                         │   UPDATE ALL family     │
  │                         │   → REVOKED             │
  │                         │◄─────────────────────── │
  │◄── 401 compromised ──── │                         │
  │                         │                         │
  │   (legitimate user's    │                         │
  │    sessions also dead — │                         │
  │    they re-authenticate)│                         │



  ======================================================

  Request A ──┐
             ├──► both pass preValidate (session is ACTIVE)
Request B ──┘
             │
             ▼
      $transaction(Serializable)
      ┌──────────────────────────────────────────┐
      │  SELECT … FOR UPDATE                     │
      │                                          │
      │  Request A acquires row lock first       │
      │    → UPDATE old → REVOKED                │
      │    → INSERT new                          │
      │    → COMMIT                              │
      │                                          │
      │  Request B waits for lock…               │
      │    → reads old row → now REVOKED         │
      │    → outside leeway (revokedAt = now)    │
      │    → BUT elapsed ≈ 0 ms < 10 s           │
      │    → replacedBy is set                   │
      │    → treated as leeway retry             │
      │    → rotates from replacement            │
      │    → COMMIT                              │
      └──────────────────────────────────────────┘

Both requests succeed. No false-positive attack.
No double-spend of the same refresh token.
*/
