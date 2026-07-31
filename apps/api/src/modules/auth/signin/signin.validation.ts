import z from "zod";
import { signUpSchema } from "../signUp/signUp.validation";

export const signInSchema = signUpSchema;

export type SignInInput = z.infer<typeof signInSchema>;
