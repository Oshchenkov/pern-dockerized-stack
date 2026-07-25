import { prisma } from "#src/config/prisma";
import { redis } from "#src/config/redis";
import { ACCESS_TOKEN_TTL_SECONDS } from "#src/utils/jwt";

export async function revokeJti(
  jti: string,
  expInSeconds: number,
  userId: string,
  reason = "manual",
) {
  const expiresAt = new Date(expInSeconds * 1000);
  const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  if (ttlSeconds <= 0) {
    return;
  }

  await redis.set(`bl:jti:${jti}`, "1", "EX", ttlSeconds).catch(() => {});

  await prisma.revokedToken
    .upsert({
      where: { jti },
      update: {},
      create: {
        jti,
        userId,
        reason,
        expiresAt,
      },
    })
    .catch(() => {});
}

export async function revokeSession(
  sessionId: string,
  userId: string,
  reason = "manual",
) {
  await prisma.session.updateMany({
    where: {
      id: sessionId,
      userId,
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  await redis.del(`session:${sessionId}`).catch(() => {});

  await redis
    .set(`bl:sid:${sessionId}`, "1", "EX", ACCESS_TOKEN_TTL_SECONDS + 60)
    .catch(() => {});
}

export async function revokeAllUserTokens(
  userId: string,
  reason = "revoke_all",
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  });

  await prisma.session.updateMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  await redis
    .set(`user:${userId}:tv`, String(user.tokenVersion))
    .catch(() => {});
}

export async function banUser(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "BANNED",
      tokenVersion: {
        increment: 1,
      },
    },
  });

  await prisma.session.updateMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  await redis.set(`user:${userId}:banned`, "1").catch(() => {});
  await redis
    .set(`user:${userId}:tv`, String(user.tokenVersion))
    .catch(() => {});
}

export async function unbanUser(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
    },
  });

  await redis.del(`user:${userId}:banned`).catch(() => {});
  await redis
    .set(`user:${userId}:tv`, String(user.tokenVersion))
    .catch(() => {});
}

/*

//Revoke current access token endpoint example

import { revokeJti } from "../services/revocation.service";
import { authenticate } from "../middleware/authenticate";

app.post(
  "/auth/revoke-current-access-token",
  authenticate(),
  async (req, res, next) => {
    try {
      const payload = req.auth!;

      await revokeJti(
        payload.jti,
        payload.exp,
        payload.sub,
        "user_requested"
      );

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
);


// Revoke all user sessions endpoint example

import { revokeAllUserTokens } from "../services/revocation.service";
import { authenticate } from "../middleware/authenticate";

app.post(
  "/auth/revoke-all-sessions",
  authenticate(),
  async (req, res, next) => {
    try {
      await revokeAllUserTokens(req.auth!.sub, "user_requested");

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
);


// Ban user endpoint example

import { banUser } from "../services/revocation.service";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/authorize";

app.post(
  "/admin/users/:id/ban",
  authenticate(),
  requirePermission("manage", "user", "id"),
  async (req, res, next) => {
    try {
      await banUser(req.params.id);

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
);


// Cleanup expired data

DELETE FROM "RevokedToken"
WHERE "expiresAt" < NOW();

DELETE FROM "Session"
WHERE "expiresAt" < NOW() - INTERVAL '30 days';

*/
