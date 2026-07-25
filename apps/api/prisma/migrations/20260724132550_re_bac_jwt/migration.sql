/*
  Warnings:

  - You are about to drop the column `bio` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `token_hash` on the `user_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refresh_token_hash]` on the table `user_sessions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[primary_email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `family_id` to the `user_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token_hash` to the `user_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- DropIndex
DROP INDEX "user_sessions_token_hash_key";

-- DropIndex
DROP INDEX "user_sessions_user_id_expires_at_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "bio",
DROP COLUMN "location",
DROP COLUMN "website",
ADD COLUMN     "profile_info" JSONB;

-- AlterTable
ALTER TABLE "user_sessions" DROP COLUMN "token_hash",
ADD COLUMN     "family_id" TEXT NOT NULL,
ADD COLUMN     "refresh_token_hash" TEXT NOT NULL,
ADD COLUMN     "replaced_by" TEXT,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email",
DROP COLUMN "email_verified",
DROP COLUMN "is_active",
ADD COLUMN     "primary_email" TEXT,
ADD COLUMN     "primary_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_credentials" (
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_revoked_tokens" (
    "jti" TEXT NOT NULL,
    "sid" TEXT,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_revoked_tokens_pkey" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "user_relationship_tuples" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_relationship_tuples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "user_identities"("user_id");

-- CreateIndex
CREATE INDEX "user_identities_email_idx" ON "user_identities"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_provider_id_key" ON "user_identities"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_revoked_tokens_expiresAt_idx" ON "user_revoked_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "user_relationship_tuples_subjectType_subjectId_relation_idx" ON "user_relationship_tuples"("subjectType", "subjectId", "relation");

-- CreateIndex
CREATE INDEX "user_relationship_tuples_objectType_objectId_relation_idx" ON "user_relationship_tuples"("objectType", "objectId", "relation");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationship_tuples_subjectType_subjectId_relation_obj_key" ON "user_relationship_tuples"("subjectType", "subjectId", "relation", "objectType", "objectId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_expires_at_status_idx" ON "user_sessions"("user_id", "expires_at", "status");

-- CreateIndex
CREATE INDEX "user_sessions_family_id_idx" ON "user_sessions"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_primary_email_key" ON "users"("primary_email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
