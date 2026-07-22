import { z } from "zod";

// ── Body ─────────────────────────────────────────────────────────────
export const createUserBody = z.object({
  name: z.string().min(2, "Name must be at least 2 chars").max(50),
  email: z.string().email("Invalid email format"),
  age: z.number().int().min(18, "Must be 18+").optional(),
  role: z.enum(["user", "admin", "moderator"]).default("user"),
});

export const loginUserBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 chars"),
});

// ── Query ────────────────────────────────────────────────────────────
export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

// ── Params ───────────────────────────────────────────────────────────
export const userIdParams = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

// ── Inferred types (use in handlers) ─────────────────────────────────
export type CreateUserBody = z.infer<typeof createUserBody>;
export type LoginUserBody = z.infer<typeof loginUserBody>;
export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type UserIdParams = z.infer<typeof userIdParams>;
