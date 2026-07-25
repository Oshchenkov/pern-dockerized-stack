// Explicit account linking while logged in
// src/services/oauth-link.service.ts
import { PrismaClient } from "@prisma/client";
import {
  encryptProviderToken,
  ENCRYPTION_KEY_ID,
} from "../lib/provider-token-encryption";

const prisma = new PrismaClient();

export async function linkOauthAccountToCurrentUser(input: {
  currentUserId: string;
  provider: string;
  providerUserId: string;
  providerEmail?: string | null;
  providerEmailVerified?: boolean;
  providerName?: string | null;
  providerAvatarUrl?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number | null;
  scope?: string | null;
}) {
  const existing = await prisma.oauthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
    },
  });

  // If this provider account is already linked to another user, block it.
  if (existing && existing.userId !== input.currentUserId) {
    throw new Error("oauth_account_already_linked_to_another_user");
  }

  const accessTokenEncrypted = input.accessToken
    ? encryptProviderToken(input.accessToken)
    : null;

  const refreshTokenEncrypted = input.refreshToken
    ? encryptProviderToken(input.refreshToken)
    : null;

  const tokenExpiresAt =
    typeof input.expiresIn === "number" && input.expiresIn > 0
      ? new Date(Date.now() + input.expiresIn * 1000)
      : null;

  return prisma.oauthAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
    },
    create: {
      userId: input.currentUserId,
      provider: input.provider,
      providerUserId: input.providerUserId,
      providerEmail: input.providerEmail?.toLowerCase() ?? null,
      providerEmailVerified: Boolean(input.providerEmailVerified),
      providerName: input.providerName,
      providerAvatarUrl: input.providerAvatarUrl,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
      tokenScope: input.scope,
      encryptionKeyId: ENCRYPTION_KEY_ID,
      lastUsedAt: new Date(),
    },
    update: {
      userId: input.currentUserId,
      providerEmail: input.providerEmail?.toLowerCase() ?? null,
      providerEmailVerified: Boolean(input.providerEmailVerified),
      providerName: input.providerName,
      providerAvatarUrl: input.providerAvatarUrl,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
      tokenScope: input.scope,
      encryptionKeyId: ENCRYPTION_KEY_ID,
      lastUsedAt: new Date(),
    },
  });
}

/*

app.post(
  "/auth/link/google/callback",
  authenticate(),
  async (req, res, next) => {
    try {
      // Validate Google code / id_token first.

      await linkOauthAccountToCurrentUser({
        currentUserId: req.auth!.sub,
        provider: "google",
        providerUserId: googlePayload.sub,
        providerEmail: googlePayload.email,
        providerEmailVerified: Boolean(googlePayload.email_verified),
        providerName: googlePayload.name,
        providerAvatarUrl: googlePayload.picture,
        accessToken: googleAccessToken,
        refreshToken: googleRefreshToken,
        expiresIn: googleExpiresIn,
        scope: googleScope,
      });

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  }
);

*/
