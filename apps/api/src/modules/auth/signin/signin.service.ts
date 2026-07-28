// Business logic
import { logger } from "#src/config/logger";
import { prisma } from "#src/config/prisma";
import { SignUpInput } from "../signup/signup.validation";
import { hashPassword } from "#src/utils/crypto";
import { issueTokens } from "#src/services/session.service";


export async function signIn(input: SignInInput, meta: { ip?: string; ua?: string }) {
    // OWASP: Generic error to prevent user enumeration
    const GENERIC_ERROR = "Invalid email or password";

    const user = await prisma.user.findUnique({
      where: { primaryEmail: input.email },
      include: { credential: true },
    });

    if (!user || !user.credential) {
      // Simulate bcrypt timing to prevent timing attacks (OWASP)
      await verifyPassword(
        input.password,
        "$2b$12$invalidhashfortimingequaliz000000000000000000000",
      );
      throw new UnauthorizedError(GENERIC_ERROR);
    }

    if (user.status === "BANNED") {
      throw new ForbiddenError("Account is suspended");
    }

    const valid = await verifyPassword(
      input.password,
      user.credential.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedError(GENERIC_ERROR);
    }

    const tokens = await issueTokens(user.id, user.tokenVersion, meta);

    return { userId: user.id, ...tokens };
  }
