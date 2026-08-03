/*
  Warnings:

  - The `revoked_reason` column on the `user_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RevokedReason" AS ENUM ('ROTATED', 'REPLAY_ATTACK', 'LOGOUT', 'ADMIN', 'EXPIRED');

-- AlterTable
ALTER TABLE "user_sessions" DROP COLUMN "revoked_reason",
ADD COLUMN     "revoked_reason" "RevokedReason";

-- DropEnum
DROP TYPE "revokedReason";
