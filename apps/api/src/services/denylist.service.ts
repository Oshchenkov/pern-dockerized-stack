// src/services/denylist.service.ts
import { redis } from "#src/config/redis";
import { prisma } from "#src/config/prisma";
import { logger } from "#src/config/pino.logger";
import { DENYLIST_PREFIX } from "#src/utils/constants";

/**
 * OWASP: Maintain a JWT denylist for logout / revocation.
 * Redis = fast path (TTL-aligned with token expiry).
 * PostgreSQL = durable audit trail + fallback if Redis is down.
 */
export const denylistService = {
  /** Add a JTI to the denylist. TTL = remaining token lifetime. */
  async add(params: {
    jti: string;
    userId: string;
    sessionId?: string;
    reason: string;
    expiresAt: Date;
  }): Promise<void> {
    const ttlSeconds = Math.max(
      0,
      Math.ceil((params.expiresAt.getTime() - Date.now()) / 1000),
    );

    // Redis fast path
    try {
      if (ttlSeconds > 0) {
        await redis.set(
          `${DENYLIST_PREFIX}${params.jti}`,
          JSON.stringify({ userId: params.userId, reason: params.reason }),
          "EX",
          ttlSeconds,
        );
      }
    } catch (err) {
      logger.warn({ err }, "Redis denylist SET failed; PG fallback active");
    }

    // PostgreSQL durable record
    await prisma.userRevokedToken.upsert({
      where: { jti: params.jti },
      create: {
        jti: params.jti,
        sid: params.sessionId ?? null,
        userId: params.userId,
        reason: params.reason,
        expiresAt: params.expiresAt,
      },
      update: {}, // idempotent
    });
  },

  /** Check if a JTI is denied. */
  async isDenied(jti: string): Promise<boolean> {
    // Redis fast path
    try {
      const val = await redis.get(`${DENYLIST_PREFIX}${jti}`);
      if (val !== null) return true;
    } catch (err) {
      logger.warn({ err }, "Redis denylist GET failed; checking PG");
    }

    // PG fallback
    const record = await prisma.userRevokedToken.findUnique({
      where: { jti },
      select: { jti: true },
    });
    return record !== null;
  },

  /** Purge expired entries (cron job). */
  async purgeExpired(): Promise<number> {
    const { count } = await prisma.userRevokedToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  },
};
