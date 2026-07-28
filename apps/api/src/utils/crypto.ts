// src/utils/crypto.ts
import crypto, { randomBytes, timingSafeEqual, randomUUID } from "node:crypto";

import argon2 from "argon2";


export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      // Explicitly sets the algorithm variant to Argon2id
      type: argon2.argon2id,

      // OWASP Recommended Minimum Parameters:
      memoryCost: 65536, // 64 MB of RAM
      timeCost: 3, // 3 iterations over memory
      parallelism: 4, // 4 concurrent threads
    });
  } catch (err) {
    throw new Error("Secure password hashing failed");
  }
}

/**
 * Verifies a plaintext password.
 * Note: Argon2 automatically detects the variant (id, i, or d)
 * from the stored hash string format.
 */
export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
}

/** Generate a cryptographically secure random token (opaque refresh token). */
export function generateOpaqueToken(bytes = 64): string {
  return randomBytes(bytes).toString("base64url");
}

/** Generate a random JTI for JWTs. */
export function generateJti(): string {
  //   return randomBytes(16).toString("hex");
  return randomUUID();
}

/** Hash a refresh token for storage (SHA-256 is sufficient for high-entropy random tokens). */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Timing-safe string comparison. */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
