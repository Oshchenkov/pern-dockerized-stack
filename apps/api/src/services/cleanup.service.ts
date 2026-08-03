import { prisma } from "#src/config/prisma";
import { logger } from "#src/config/logger";

const BATCH_SIZE = 1_000;
const BATCH_PAUSE_MS = 100;

/**
 * Delete rows in batches to avoid:
 *   - long table locks
 *   - WAL bloat
 *   - replication lag
 *
 * Uses raw SQL because Prisma's deleteMany() doesn't support LIMIT.
 * The `ctid IN (SELECT ctid … LIMIT n)` pattern deletes a bounded set
 * per iteration without needing a subquery on the PK.
 */
async function batchDelete(
  table: string,
  whereClause: string,
  batchSize: number = BATCH_SIZE,
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const deleted: number = await prisma.$executeRawUnsafe(`
      DELETE FROM ${table}
      WHERE ctid IN (
        SELECT ctid FROM ${table}
        WHERE ${whereClause}
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
    `);

    totalDeleted += deleted;

    if (deleted < batchSize) break; // no more rows

    // Small pause to let the DB breathe between batches
    await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
  }

  return totalDeleted;
}

export const cleanupService = {
  /**
   * Remove expired sessions.
   * Safe to run concurrently — SKIP LOCKED prevents deadlocks.
   */
  async purgeExpiredSessions(): Promise<number> {
    const count = await batchDelete("user_sessions", `expires_at < NOW()`);

    if (count > 0) {
      logger.info({ count }, "Purged expired sessions");
    }
    return count;
  },

  /**
   * Remove expired denylist entries.
   * Redis already auto-expires via TTL; this cleans the PG fallback.
   */
  async purgeExpiredDenylist(): Promise<number> {
    const count = await batchDelete(
      "user_revoked_tokens",
      `expires_at < NOW()`,
    );

    if (count > 0) {
      logger.info({ count }, "Purged expired denylist entries");
    }
    return count;
  },

  /**
   * Remove sessions that have been REVOKED for a long time
   * and are past their expiry. No need to keep audit rows forever.
   */
  async purgeOldRevokedSessions(daysOld = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 86_400_000);
    const count = await batchDelete(
      "user_sessions",
      `status = 'REVOKED' AND expires_at < '${cutoff.toISOString()}'`,
    );

    if (count > 0) {
      logger.info({ count, daysOld }, "Purged old revoked sessions");
    }
    return count;
  },

  async runAll(): Promise<{
    sessions: number;
    denylist: number;
    oldRevoked: number;
  }> {
    const start = Date.now();

    const [sessions, denylist, oldRevoked] = await Promise.all([
      this.purgeExpiredSessions(),
      this.purgeExpiredDenylist(),
      this.purgeOldRevokedSessions(),
    ]);

    logger.info(
      {
        sessions,
        denylist,
        oldRevoked,
        durationMs: Date.now() - start,
      },
      "Cleanup completed",
    );
    return { sessions, denylist, oldRevoked };
  },
};
