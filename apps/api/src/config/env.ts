import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("production"),
    PORT: z.coerce.number().default(4000),

    // Database
    DATABASE_URL: z.url(),

    // Redis
    REDIS_URL: z.url(),

    // JWT
    JWT_ACCESS_SECRET: z.string().min(64),
    JWT_REFRESH_SECRET: z.string().min(64),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(300),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(604800),
    JWT_ISSUER: z.string().default("http://localhost:4000"),
    JWT_AUDIENCE: z.string().default("http://localhost:4000"),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000), // 15 min
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),

    // Cookie
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: z.coerce.boolean().default(true),

    CORS_ORIGIN: z.string().optional(),
  })
  .transform((env) => ({
    ...env,
    isProduction: env.NODE_ENV === "production",
    isDevelopment: env.NODE_ENV !== "production",
  }));

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
