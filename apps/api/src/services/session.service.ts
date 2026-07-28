// src/services/session.service.ts
import { prisma } from "#src/config/prisma";
import { env } from "#src/config/env";
import { logger } from "#src/config/logger";

import {
  hashToken,
  hashPassword,
  verifyPassword,
  generateOpaqueToken,
} from "#src/utils/crypto";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from "#src/services/token.service";

export const sessionService = {
  /**
   * Create a new session (sign-in / sign-up).
   * Returns the session record. The caller stores the hashed refresh token.
   */
  async create(params: {
    userId: string;
    refreshToken: string; // raw opaque or JWT — we hash before storing
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  }) {
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

    return prisma.userSession.create({
      data: {
        familyId,
        userId: params.userId,
        refreshTokenHash: hashToken(params.refreshToken),
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        country: params.country ?? null,
        expiresAt,
        status: "ACTIVE",
      },
    });
  },

  /**
   * OWASP Refresh Token Rotation with Reuse Detection.
   *
   * 1. Validate the incoming refresh token hash exists & is ACTIVE.
   * 2. If the token was already used (REVOKED + replacedBy set) →
   *    REUSE DETECTED → revoke entire family.
   * 3. Otherwise, revoke old session, create new session in same family.
   */
  async rotate(params: {
    oldRefreshToken: string;
    newRefreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const oldHash = hashToken(params.oldRefreshToken);

    const oldSession = await prisma.userSession.findUnique({
      where: { refreshTokenHash: oldHash },
    });

    if (!oldSession) {
      throw new Error("SESSION_NOT_FOUND");
    }

    // --- REUSE DETECTION ---
    if (oldSession.status === "REVOKED") {
      // Someone replayed an old token → compromise detected.
      logger.warn(
        {
          sessionId: oldSession.id,
          familyId: oldSession.familyId,
          userId: oldSession.userId,
        },
        "Refresh token reuse detected — revoking entire family",
      );
      await this.revokeFamily(oldSession.familyId);
      throw new Error("TOKEN_REUSE_DETECTED");
    }

    if (oldSession.status !== "ACTIVE") {
      throw new Error("SESSION_INACTIVE");
    }

    // Check expiry
    if (oldSession.expiresAt < new Date()) {
      await prisma.userSession.update({
        where: { id: oldSession.id },
        data: { status: "REVOKED", revokedAt: new Date() },
      });
      throw new Error("SESSION_EXPIRED");
    }

    // --- ROTATE ---
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

    const [newSession] = await prisma.$transaction([
      // Revoke old
      prisma.userSession.update({
        where: { id: oldSession.id },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          replacedBy: "", // will be set after create
        },
      }),
      // Create new in same family
      prisma.userSession.create({
        data: {
          familyId: oldSession.familyId,
          userId: oldSession.userId,
          refreshTokenHash: hashToken(params.newRefreshToken),
          ipAddress: params.ipAddress ?? oldSession.ipAddress,
          userAgent: params.userAgent ?? oldSession.userAgent,
          country: oldSession.country,
          expiresAt: newExpiresAt,
          status: "ACTIVE",
        },
      }),
    ]);

    // Link old → new
    await prisma.userSession.update({
      where: { id: oldSession.id },
      data: { replacedBy: newSession.id },
    });

    return { newSession, userId: oldSession.userId };
  },

  /** Revoke all sessions in a family (reuse detection / logout-all on device). */
  async revokeFamily(familyId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { familyId, status: "ACTIVE" },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
  },

  /** Revoke a single session (logout). */
  async revoke(sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
  },

  /** Revoke ALL sessions for a user (password change, admin ban, etc.). */
  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
  },

  /** Validate session is still active (used during access-token verification). */
  async isActive(sessionId: string): Promise<boolean> {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { status: true, expiresAt: true },
    });
    if (!session) return false;
    return session.status === "ACTIVE" && session.expiresAt > new Date();
  },

  /** Purge expired sessions (cron). */
  async purgeExpired(): Promise<number> {
    const { count } = await prisma.userSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  },
};

// ─── INTERNAL: Issue token pair + create session ────────────────────────
export async function issueTokens(
  userId: string,
  tokenVersion: number,
  meta: { ip?: string; ua?: string },
) {
  const refreshRaw = generateOpaqueToken();

  // Create session first to get sessionId
  const session = await sessionService.create({
    userId,
    refreshToken: refreshRaw, // hashed inside
    ipAddress: meta.ip,
    userAgent: meta.ua,
  });

  const accessToken = await signAccessToken({
    userId,
    sessionId: session.id,
    tokenVersion,
  });

  const refreshToken = await signRefreshToken({
    userId,
    sessionId: session.id,
    familyId: session.familyId,
    tokenVersion,
  });

  // Update session hash to the JWT refresh token (so rotate() can find it)
  const { hashToken } = await import("#src/utils/crypto");
  await prisma.userSession.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: ACCESS_TOKEN_TTL,
    refreshExpiresIn: REFRESH_TOKEN_TTL,
  };
}
