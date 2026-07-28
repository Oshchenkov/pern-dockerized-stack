import { z } from "zod";

export const signUpSchema = z.object({
  body: z.object({
    email: z
      .email("Invalid email format")
      .max(254)
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    // .regex(/[a-z]/, "Must contain a lowercase letter")
    // .regex(/[A-Z]/, "Must contain an uppercase letter")
    // .regex(/[0-9]/, "Must contain a digit")
    // .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
    // name: z.string().min(1).max(100).optional(),
    // surname: z.string().min(1).max(100).optional(),
  }),
});

export const signInSchema = z.object({
  body: z.object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase().trim()),
    password: z.string().min(1).max(128),
  }),
});

export const refreshSchema = z.object({
  cookies: z.object({
    "__Host-rt": z.string().min(1),
  }),
});

export const logoutSchema = z.object({
  cookies: z.object({
    "__Host-rt": z.string().min(1),
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>["body"];
export type SignInInput = z.infer<typeof signInSchema>["body"];
