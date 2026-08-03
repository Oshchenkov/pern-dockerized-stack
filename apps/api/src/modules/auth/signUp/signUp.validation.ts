import { z } from "zod";

export const signUpSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a digit")
    .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
