import { z } from "zod";

export const signupBodySchema = z.object({
  name: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
