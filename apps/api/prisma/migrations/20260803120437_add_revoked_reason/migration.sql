-- CreateEnum
CREATE TYPE "revokedReason" AS ENUM ('ROTATED', 'REPLAY_ATTACK', 'LOGOUT', 'ADMIN', 'EXPIRED');

-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "revoked_reason" "revokedReason";
