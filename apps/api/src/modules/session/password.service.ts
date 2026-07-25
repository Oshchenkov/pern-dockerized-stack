// src/services/password.service.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../lib/password";
import { createSession } from "./session.service";

const prisma = new PrismaClient();

export async function registerPassword(input: {
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { primaryEmail: email },
  });

  if (existing) {
    throw new Error("email_already_exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      primaryEmail: email,
      emailVerified: false,
      credential: {
        create: {
          passwordHash,
        },
      },
    },
  });

  // TODO: send verification email.

  return user;
}

export async function loginPassword(input: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { primaryEmail: email },
    include: {
      credential: true,
    },
  });

  // Use the same generic error to prevent user enumeration.
  if (!user || !user.credential) {
    throw new Error("invalid_credentials");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("user_banned");
  }

  const valid = await verifyPassword(
    user.credential.passwordHash,
    input.password,
  );

  if (!valid) {
    throw new Error("invalid_credentials");
  }

  return createSession(user, {
    amr: ["pwd"],
    ip: input.ip,
    userAgent: input.userAgent,
  });
}
