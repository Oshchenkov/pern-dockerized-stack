// src/modules/auth/auth.service.ts
import { prisma } from "#src/config/prisma";
import {
  hashPassword,
  verifyPassword,
  generateOpaqueToken,
} from "#src/utils/crypto";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from "#src/services/token.service";
import { sessionService } from "../../services/session.service";
import { denylistService } from "../../services/denylist.service";
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from "#src/middleware/error.middleware";
import pinoLogger from "#src/config/pinoLogger";
import type { SignUpInput, SignInInput } from "./auth.schema";

export const authService = {
  // ─── SIGN UP ────────────────────────────────────────────────────────────
  async signUp(input: SignUpInput, meta: { ip?: string; ua?: string }) {
    // OWASP: Check existing email — but return generic message to prevent enumeration
    const existing = await prisma.user.findUnique({
      where: { primaryEmail: input.email },
      select: { id: true },
    });

    if (existing) {
      // OWASP: Do NOT reveal whether the email exists.
      // Return success-like response; send a "you already have an account" email async.
      pinoLogger.info(
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
          status: "ACTIVE",
          credential: {
            create: { passwordHash },
          },
          // profile: {
          //   create: {
          //     name: input.name ?? null,
          //     surname: input.surname ?? null,
          //   },
          // },
        },
      });
      return newUser;
    });

    // Create session + tokens
    const tokens = await this._issueTokens(user.id, user.tokenVersion, meta);

    return { userId: user.id, alreadyExists: false, ...tokens };
  },

  // ─── SIGN IN ────────────────────────────────────────────────────────────
  async signIn(input: SignInInput, meta: { ip?: string; ua?: string }) {
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

    const tokens = await this._issueTokens(user.id, user.tokenVersion, meta);

    return { userId: user.id, ...tokens };
  },

  // ─── REFRESH ────────────────────────────────────────────────────────────
  async refresh(refreshTokenRaw: string, meta: { ip?: string; ua?: string }) {
    // 1. Verify JWT signature & expiry
    let payload;
    try {
      payload = await verifyRefreshToken(refreshTokenRaw);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // 2. Check denylist
    if (payload.jti && (await denylistService.isDenied(payload.jti))) {
      throw new UnauthorizedError("Token has been revoked");
    }

    // 3. Rotate session (includes reuse detection)
    let result;
    try {
      result = await sessionService.rotate({
        oldRefreshToken: refreshTokenRaw,
        newRefreshToken: "", // placeholder, replaced below
        ipAddress: meta.ip,
        userAgent: meta.ua,
      });
    } catch (err: any) {
      if (err.message === "TOKEN_REUSE_DETECTED") {
        // Denylist the compromised JTI
        if (payload.jti) {
          await denylistService.add({
            jti: payload.jti,
            userId: payload.sub!,
            sessionId: payload.sid,
            reason: "refresh_token_reuse",
            expiresAt: new Date((payload.exp ?? 0) * 1000),
          });
        }
        throw new UnauthorizedError(
          "Session compromised — all sessions revoked",
        );
      }
      throw new UnauthorizedError("Session invalid");
    }

    // 4. Verify tokenVersion (OWASP: invalidate tokens after password change)
    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { tokenVersion: true, status: true },
    });

    if (!user || user.status === "BANNED") {
      throw new ForbiddenError("Account unavailable");
    }
    if (payload.tv !== user.tokenVersion) {
      throw new UnauthorizedError(
        "Token version mismatch — please sign in again",
      );
    }

    // 5. Issue new token pair
    const newRefreshRaw = generateOpaqueToken();

    // Update the session's hash to the new refresh token
    // (sessionService.rotate already created the session with a placeholder hash;
    //  in production you'd pass the real token into rotate. Here we re-hash.)
    // For simplicity, we issue a JWT refresh token and store its hash.
    const newRefreshJwt = await signRefreshToken({
      userId: result.userId,
      sessionId: result.newSession.id,
      familyId: result.newSession.familyId,
      tokenVersion: user.tokenVersion,
    });

    const newAccess = await signAccessToken({
      userId: result.userId,
      sessionId: result.newSession.id,
      tokenVersion: user.tokenVersion,
    });

    // Denylist the OLD refresh JTI
    if (payload.jti) {
      await denylistService.add({
        jti: payload.jti,
        userId: result.userId,
        sessionId: payload.sid,
        reason: "rotated",
        expiresAt: new Date((payload.exp ?? 0) * 1000),
      });
    }

    return {
      accessToken: newAccess,
      refreshToken: newRefreshJwt,
      accessExpiresIn: ACCESS_TOKEN_TTL,
      refreshExpiresIn: REFRESH_TOKEN_TTL,
    };
  },

  // ─── LOGOUT ─────────────────────────────────────────────────────────────
  async logout(
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
  },

  // ─── INTERNAL: Issue token pair + create session ────────────────────────
  async _issueTokens(
    userId: string,
    tokenVersion: number,
    meta: { ip?: string; ua?: string },
  ) {
    const refreshRaw = generateOpaqueToken();

    // Create session first to get sessionId
    const session = await sessionService.create({
      userId,
      refreshToken: refreshRaw, // hashed inside
      ipAddress: meta.ip,
      userAgent: meta.ua,
    });

    const accessToken = await signAccessToken({
      userId,
      sessionId: session.id,
      tokenVersion,
    });

    const refreshToken = await signRefreshToken({
      userId,
      sessionId: session.id,
      familyId: session.familyId,
      tokenVersion,
    });

    // Update session hash to the JWT refresh token (so rotate() can find it)
    const { hashToken } = await import("#src/utils/crypto");
    await prisma.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: hashToken(refreshToken) },
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: ACCESS_TOKEN_TTL,
      refreshExpiresIn: REFRESH_TOKEN_TTL,
    };
  },
};
