// src/services/social.service.ts
import { PrismaClient } from "@prisma/client";
import { createSession } from "./session.service";

const prisma = new PrismaClient();

type SocialProfile = {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  emailVerified?: boolean;
  profile?: Record<string, unknown>;
};

export async function socialLogin(
  profile: SocialProfile,
  input: {
    ip?: string;
    userAgent?: string;
  },
) {
  const provider = profile.provider;
  const providerAccountId = String(profile.providerAccountId);

  const email = profile.email ? profile.email.trim().toLowerCase() : null;

  const emailVerified = Boolean(profile.emailVerified);

  let identity = await prisma.identity.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: {
      user: true,
    },
  });

  if (!identity) {
    // Try to link only when email is verified.
    if (email && emailVerified) {
      const existingUser = await prisma.user.findUnique({
        where: { primaryEmail: email },
      });

      if (existingUser) {
        identity = await prisma.identity.create({
          data: {
            provider,
            providerAccountId,
            userId: existingUser.id,
            email,
            emailVerified,
            profile: profile.profile ?? undefined,
          },
          include: {
            user: true,
          },
        });
      }
    }

    // Create a new user if no safe link was possible.
    if (!identity) {
      const user = await prisma.user.create({
        data: {
          primaryEmail: emailVerified ? email : null,
          emailVerified,
          identities: {
            create: {
              provider,
              providerAccountId,
              email,
              emailVerified,
              profile: profile.profile ?? undefined,
            },
          },
        },
        include: {
          identities: true,
        },
      });

      identity = await prisma.identity.findUniqueOrThrow({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: {
          user: true,
        },
      });
    }
  }

  if (identity.user.status !== "ACTIVE") {
    throw new Error("user_banned");
  }

  return createSession(identity.user, {
    amr: [provider],
    ip: input.ip,
    userAgent: input.userAgent,
  });
}

/*
//Example Google OIDC callback shape:
// After validating Google id_token server-side:
await socialLogin(
  {
    provider: "google",
    providerAccountId: googlePayload.sub,
    email: googlePayload.email,
    emailVerified: Boolean(googlePayload.email_verified),
    profile: googlePayload,
  },
  {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  }
);

// Example GitHub callback shape:

// After exchanging code and fetching /user and /user/emails:
await socialLogin(
  {
    provider: "github",
    providerAccountId: String(githubUser.id),
    email: primaryVerifiedEmail,
    emailVerified: primaryEmailVerified,
    profile: githubUser,
  },
  {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  }
);

*/
