import { z } from "zod";
import { paginationSchema, searchSchema, sortSchema } from "./common.schema.js";

export const createUserBodySchema = z.object({
  name: z.string().min(2).max(50),
  email: z.email(),
  age: z.number().int().min(18).optional(),
  role: z.enum(["user", "admin", "moderator"]).default("user"),
});

export const updateUserBodySchema = createUserBodySchema.partial();

export const listUsersQuerySchema = z.object({
  ...paginationSchema.shape,
  ...searchSchema.shape,
  ...sortSchema.shape,
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
