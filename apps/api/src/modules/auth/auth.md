SIGN UP / SIGN IN
─────────────────
Client → POST /auth/signup {email, password}
→ Zod validation
→ Rate limiter (Redis)
→ bcrypt hash password
→ Prisma: create User + Credential + Profile + Session
→ jose: sign access JWT (15m) + refresh JWT (7d)
→ SHA-256 hash refresh JWT → store in UserSession
→ Set **Host-at + **Host-rt cookies
← 201 { userId }

REFRESH
───────
Client → POST /auth/refresh (cookie: \_\_Host-rt)
→ jose: verify refresh JWT signature + expiry
→ Redis: check JTI not in denylist
→ Prisma: find session by SHA-256(refreshToken)
→ If REVOKED → REUSE DETECTED → revoke family → 401
→ If ACTIVE → rotate: revoke old, create new session (same familyId)
→ Check tokenVersion against User table
→ jose: sign new access + refresh JWTs
→ Denylist old JTI in Redis + PG
→ Set new cookies
← 200

LOGOUT
──────
Client → POST /auth/logout (cookies: **Host-at + **Host-rt)
→ Revoke session in Prisma
→ Denylist both JTIs in Redis + PG
→ Clear cookies
← 200

PROTECTED REQUEST
─────────────────
Client → GET /auth/me (cookie: \_\_Host-at)
→ authenticate middleware:
jose verify → denylist check → tokenVersion check → session active check
→ Fetch user from Prisma
← 200 { user }s
