/*
Client
  |
  | Authorization: Bearer access JWT
  | or HttpOnly refresh cookie
  v
Express API
  |
  |-- authenticate middleware
  |     |-- verify JWT signature
  |     |-- check Redis denylist
  |     |-- check PostgreSQL user/status/tokenVersion
  |     |-- check session status
  |
  |-- authorize middleware
  |     |-- ReBAC check
  |     |-- Redis ReBAC cache
  |     |-- PostgreSQL relationship tuples
  |
  |-- auth service
        |-- password login
        |-- social login
        |-- refresh rotation
        |-- signout
        |-- ban/revoke

*/

// src/middleware/authenticate.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken, AccessTokenPayload } from "../lib/jwt";
import { redis } from "../lib/redis";

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export function authenticate() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || "";

      if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "missing_bearer_token" });
      }

      const token = header.slice(7);

      let payload: AccessTokenPayload;

      try {
        payload = await verifyAccessToken(token);
      } catch {
        return res.status(401).json({ error: "invalid_access_token" });
      }

      const userId = payload.sub;
      const jti = payload.jti;
      const sid = payload.sid;
      const tv = payload.tv;

      if (!userId || !jti || !sid || typeof tv !== "number") {
        return res.status(401).json({ error: "invalid_token_claims" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(401).json({ error: "user_not_found" });
      }

      if (user.status !== "ACTIVE") {
        return res.status(403).json({ error: "user_banned" });
      }

      const cachedTokenVersion = await redis
        .get(`user:${userId}:tv`)
        .catch(() => null);

      const expectedTokenVersion = cachedTokenVersion
        ? Number(cachedTokenVersion)
        : user.tokenVersion;

      if (tv !== expectedTokenVersion) {
        return res.status(401).json({ error: "token_version_revoked" });
      }

      let redisError = false;
      let jtiBlocked: string | null = null;
      let sidBlocked: string | null = null;
      let sessionCached: string | null = null;

      try {
        [jtiBlocked, sidBlocked, sessionCached] = await redis.mget(
          `bl:jti:${jti}`,
          `bl:sid:${sid}`,
          `session:${sid}`,
        );
      } catch {
        redisError = true;
      }

      if (jtiBlocked || sidBlocked) {
        return res.status(401).json({ error: "token_revoked" });
      }

      // If Redis is unavailable or session key is missing, fall back to PostgreSQL.
      if (redisError || sessionCached === null) {
        const session = await prisma.session.findUnique({
          where: { id: sid },
        });

        if (!session || session.status !== "ACTIVE") {
          return res.status(401).json({ error: "session_revoked" });
        }

        const revoked = await prisma.revokedToken.findUnique({
          where: { jti },
        });

        if (revoked && revoked.expiresAt > new Date()) {
          return res.status(401).json({ error: "token_revoked" });
        }
      }

      req.auth = payload;

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
