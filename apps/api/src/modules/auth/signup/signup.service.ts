// Business logic
import { logger } from "#src/config/logger";
import { prisma } from "#src/config/prisma";
import { SignUpInput } from "./signup.validation";
import { hashPassword } from "#src/utils/crypto";
import { issueTokens } from "#src/services/session.service";
import { UserStatus } from "#root/prisma/generated/prisma/enums";

export async function signUpService(
  input: SignUpInput,
  meta: { ip?: string; ua?: string },
) {
  // OWASP: Check existing email — but return generic message to prevent enumeration
  const existing = await prisma.user.findUnique({
    where: { primaryEmail: input.email },
    select: { id: true },
  });

  if (existing) {
    // OWASP: Do NOT reveal whether the email exists.
    // Return success-like response; send a "you already have an account" email async.
    logger.info(
      { email: input.email },
      "Sign-up attempted with existing email",
    );
    return { userId: null, alreadyExists: true };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        primaryEmail: input.email,
        primaryEmailVerified: false,
        status: UserStatus.ACTIVE,
        credential: {
          create: { passwordHash },
        },
        profile: {
          create: {
            profileInfo: meta,
          },
        },
      },
    });
    return newUser;
  });

  // Create session + tokens
  const tokens = await issueTokens(user.id, user.tokenVersion, meta);

  return { userId: user.id, alreadyExists: false, ...tokens };
}
