import { RevokedReason } from "#root/prisma/generated/prisma/enums";
import { denylistService } from "#src/services/denylist.service";
import { sessionService } from "#src/services/session.service";
import { ACCESS_TOKEN_TTL } from "#src/services/token.service";

interface SignOutParams {
  userId: string;
  sessionId: string;
  accessJti?: string;
  accessExp?: number; // unix seconds from JWT
}

export async function signOutService({
  userId,
  sessionId,
  accessJti,
  accessExp,
}: SignOutParams) {
  // 1. Revoke the session → kills the refresh token chain
  await sessionService.revoke(sessionId, RevokedReason.SIGNOUT);

  // 2. Denylist the access token JTI → kills the in-flight access token
  if (accessJti) {
    const expiresAt = accessExp
      ? new Date(accessExp * 1000)
      : new Date(Date.now() + ACCESS_TOKEN_TTL * 1000);

    await denylistService.add({
      jti: accessJti,
      userId,
      sessionId,
      reason: RevokedReason.SIGNOUT,
      expiresAt,
    });
  }
}
