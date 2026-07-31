import { denylistService } from "#src/services/denylist.service";
import { sessionService } from "#src/services/session.service";
import { ACCESS_TOKEN_TTL, verifyRefreshToken } from "#src/services/token.service";

export async function signOutService(
    refreshTokenRaw: string,
    accessTokenJti?: string,
    userId?: string,
  ) {
    // Revoke the session
    try {
      const payload = await verifyRefreshToken(refreshTokenRaw);
      if (payload.sid) {
        await sessionService.revoke(payload.sid);
      }
      // Denylist the refresh JTI
      if (payload.jti) {
        await denylistService.add({
          jti: payload.jti,
          userId: payload.sub!,
          sessionId: payload.sid,
          reason: "logout",
          expiresAt: new Date((payload.exp ?? 0) * 1000),
        });
      }
    } catch {
      // Token already invalid — that's fine
    }

    // Denylist the current access token JTI (if provided)
    if (accessTokenJti && userId) {
      await denylistService.add({
        jti: accessTokenJti,
        userId,
        reason: "logout",
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL * 1000),
      });
    }
  }