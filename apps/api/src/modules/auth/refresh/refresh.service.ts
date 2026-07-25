import crypto, { randomUUID } from "crypto";
import { hashToken } from "#src/utils/handleToken";
import { issueAccessToken, ACCESS_TOKEN_TTL_SECONDS } from "#src/utils/jwt";
import { prisma } from "#src/config/prisma";

export const REFRESH_TOKEN_TTL_SECONDS = Number(
  process.env.REFRESH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 14,
);

const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;

export async function createSession(
  user: { id: string; tokenVersion: number },
  input: {
    amr: string[];
    ip?: string;
    userAgent?: string;
  },
) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      ip: input.ip,
      userAgent: input.userAgent,
    },
  });

  const access = await issueAccessToken({
    userId: user.id,
    sessionId: session.id,
    tokenVersion: user.tokenVersion,
    amr: input.amr,
  });

  await redis
    .set(`session:${session.id}`, user.id, "EX", REFRESH_TOKEN_TTL_SECONDS)
    .catch(() => {});

  return {
    accessToken: access.token,
    accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken,
    sessionId: session.id,
  };
}

export async function refreshSession(
  refreshToken: string,
  input: {
    ip?: string;
    userAgent?: string;
  },
) {
  const tokenHash = hashToken(refreshToken);

  const oldSession = await prisma.session.findUnique({
    where: { refreshTokenHash: tokenHash },
    include: { user: true },
  });

  if (!oldSession) {
    throw new Error("invalid_refresh_token");
  }

  if (oldSession.user.status !== "ACTIVE") {
    throw new Error("user_banned");
  }

  // Refresh token reuse detection.
  if (oldSession.status === "REVOKED") {
    await prisma.session.updateMany({
      where: { familyId: oldSession.familyId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    throw new Error("refresh_token_reuse_detected");
  }

  if (oldSession.expiresAt < new Date()) {
    throw new Error("refresh_token_expired");
  }

  const newSessionId = randomUUID();
  const newRefreshToken = crypto.randomBytes(48).toString("base64url");

  await prisma.$transaction([
    prisma.session.update({
      where: { id: oldSession.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        replacedBy: newSessionId,
      },
    }),

    prisma.session.create({
      data: {
        id: newSessionId,
        familyId: oldSession.familyId,
        userId: oldSession.userId,
        refreshTokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        ip: input.ip,
        userAgent: input.userAgent,
      },
    }),
  ]);

  const access = await issueAccessToken({
    userId: oldSession.userId,
    sessionId: newSessionId,
    tokenVersion: oldSession.user.tokenVersion,
    amr: ["refresh"],
  });

  await redis.del(`session:${oldSession.id}`).catch(() => {});

  await redis
    .set(
      `session:${newSessionId}`,
      oldSession.userId,
      "EX",
      REFRESH_TOKEN_TTL_SECONDS,
    )
    .catch(() => {});

  return {
    accessToken: access.token,
    accessExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken: newRefreshToken,
    sessionId: newSessionId,
  };
}

export async function logout(input: {
  refreshToken?: string;
  accessJti?: string;
  accessSid?: string;
  accessExp?: number;
  userId?: string;
}) {
  if (input.refreshToken) {
    const session = await prisma.session.findUnique({
      where: {
        refreshTokenHash: hashToken(input.refreshToken),
      },
    });

    if (session) {
      await prisma.session
        .update({
          where: { id: session.id },
          data: {
            status: "REVOKED",
            revokedAt: new Date(),
          },
        })
        .catch(() => {});

      await redis.del(`session:${session.id}`).catch(() => {});

      await redis
        .set(`bl:sid:${session.id}`, "1", "EX", ACCESS_TOKEN_TTL_SECONDS + 60)
        .catch(() => {});
    }
  }

  if (input.accessJti && input.accessExp && input.userId) {
    await revokeJti(input.accessJti, input.accessExp, input.userId, "logout");
  }
}

/*

res.cookie("refresh_token", refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/auth/refresh",
  maxAge: 1000 * 60 * 60 * 24 * 14,
});


*/
