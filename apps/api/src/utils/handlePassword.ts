import argon2 from "argon2";

async function hashPassword(password: string): Promise<string> {
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
async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    return false;
  }
}

export { hashPassword, verifyPassword };
