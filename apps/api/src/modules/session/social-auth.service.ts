// src/services/social-auth.service.ts
import { PrismaClient } from "@prisma/client";
import { createSession } from "./session.service";
import { upsertOauthAccount, ProviderTokens } from "./oauth-account.service";

const prisma = new PrismaClient();

export type SocialProfile = {
  provider: string;
  providerUserId: string;
  email?: string | null;
  emailVerified?: boolean;
  name?: string | null;
  avatarUrl?: string | null;
  tokens?: ProviderTokens | null;
};

export async function socialLogin(
  profile: SocialProfile,
  input: {
    ip?: string;
    userAgent?: string;
  },
) {
  const provider = profile.provider;
  const providerUserId = String(profile.providerUserId);

  const email = profile.email ? profile.email.trim().toLowerCase() : null;

  const emailVerified = Boolean(profile.emailVerified);

  // 1. Existing OAuth account?
  const existingOauthAccount = await prisma.oauthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingOauthAccount) {
    if (existingOauthAccount.user.status !== "ACTIVE") {
      throw new Error("user_banned");
    }

    // Update provider profile/tokens.
    await upsertOauthAccount({
      userId: existingOauthAccount.userId,
      provider,
      providerUserId,
      providerEmail: email,
      providerEmailVerified: emailVerified,
      providerName: profile.name,
      providerAvatarUrl: profile.avatarUrl,
      tokens: profile.tokens,
    });

    return createSession(existingOauthAccount.user, {
      amr: [provider],
      ip: input.ip,
      userAgent: input.userAgent,
    });
  }

  // 2. Try safe email linking.
  //
  // Only link automatically if the provider says the email is verified.
  // If you want stricter security, disable automatic linking completely
  // and require the user to link accounts while logged in.
  if (email && emailVerified) {
    const existingUser = await prisma.user.findUnique({
      where: { primaryEmail: email },
    });

    if (existingUser) {
      if (existingUser.status !== "ACTIVE") {
        throw new Error("user_banned");
      }

      await upsertOauthAccount({
        userId: existingUser.id,
        provider,
        providerUserId,
        providerEmail: email,
        providerEmailVerified: emailVerified,
        providerName: profile.name,
        providerAvatarUrl: profile.avatarUrl,
        tokens: profile.tokens,
      });

      return createSession(existingUser, {
        amr: [provider],
        ip: input.ip,
        userAgent: input.userAgent,
      });
    }
  }

  // 3. Create new user + OAuth account.
  const newUser = await prisma.user.create({
    data: {
      primaryEmail: emailVerified ? email : null,
      emailVerified,
    },
  });

  await upsertOauthAccount({
    userId: newUser.id,
    provider,
    providerUserId,
    providerEmail: email,
    providerEmailVerified: emailVerified,
    providerName: profile.name,
    providerAvatarUrl: profile.avatarUrl,
    tokens: profile.tokens,
  });

  const createdUser = await prisma.user.findUniqueOrThrow({
    where: { id: newUser.id },
  });

  return createSession(createdUser, {
    amr: [provider],
    ip: input.ip,
    userAgent: input.userAgent,
  });
}

/*
//  Example Google login usage

const result = await socialLogin(
  {
    provider: "google",
    providerUserId: googlePayload.sub,
    email: googlePayload.email,
    emailVerified: Boolean(googlePayload.email_verified),
    name: googlePayload.name,
    avatarUrl: googlePayload.picture,

    // Optional: only store if you need Google API access.
    tokens: {
      accessToken: googleAccessToken,
      refreshToken: googleRefreshToken,
      expiresIn: googleExpiresIn,
      scope: googleScope,
    },
  },
  {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  }
);

//

const result = await socialLogin(
  {
    provider: "google",
    providerUserId: googlePayload.sub,
    email: googlePayload.email,
    emailVerified: Boolean(googlePayload.email_verified),
    name: googlePayload.name,
    avatarUrl: googlePayload.picture,
    tokens: null,
  },
  {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  }
);


// Example GitHub login usage

const result = await socialLogin(
  {
    provider: "github",
    providerUserId: String(githubUser.id),
    email: primaryVerifiedEmail,
    emailVerified: primaryEmailVerified,
    name: githubUser.name ?? githubUser.login,
    avatarUrl: githubUser.avatar_url,

    // Optional.
    tokens: {
      accessToken: githubAccessToken,
      refreshToken: null,
      expiresIn: githubExpiresIn ?? null,
      scope: githubScope,
    },
  },
  {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  }
);

// Example Facebook login usage

const result = await socialLogin(
  {
    provider: "facebook",
    providerUserId: facebookUser.id,
    email: facebookUser.email,
    emailVerified: Boolean(facebookUser.email), // Facebook behavior varies; be careful.
    name: facebookUser.name,
    avatarUrl: facebookUser.picture?.data?.url,

    tokens: {
      accessToken: facebookAccessToken,
      refreshToken: null,
      expiresIn: facebookExpiresIn,
      scope: facebookScope,
    },
  },
  {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  }
);


// Explicit account linking while logged in



*/
