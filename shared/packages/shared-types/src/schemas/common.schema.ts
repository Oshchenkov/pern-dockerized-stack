import { z } from "zod";

// ── Pagination (used everywhere) ─────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Search ───────────────────────────────────────────────────────────
export const searchSchema = z.object({
  search: z.string().max(200).optional(),
});

// ── Sort ─────────────────────────────────────────────────────────────
export const sortSchema = z.object({
  sort: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.string().optional(),
});

// ── Inferred types ───────────────────────────────────────────────────
export type Pagination = z.infer<typeof paginationSchema>;
export type Search = z.infer<typeof searchSchema>;
export type Sort = z.infer<typeof sortSchema>;
