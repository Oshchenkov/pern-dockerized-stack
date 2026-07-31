import z from "zod";
import { signUpSchema } from "../signup/signup.validation";

export const signInSchema = signUpSchema;

export type SignInInput = z.infer<typeof signInSchema>;
