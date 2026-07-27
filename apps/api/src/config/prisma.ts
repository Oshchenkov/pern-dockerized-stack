import { env } from "#src/config/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "#root/prisma/generated/prisma/client";

const connectionString = env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

const log: Prisma.LogLevel[] = env.isProduction
  ? ["error"]
  : ["query", "info", "warn", "error"];

const prisma = new PrismaClient({ adapter, log });

export { prisma };
