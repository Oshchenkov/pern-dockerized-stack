import { env } from "#src/config/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#root/prisma/generated/prisma/client";

const connectionString = env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
