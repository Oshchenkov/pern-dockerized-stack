/*
  Warnings:

  - You are about to drop the column `objectId` on the `user_relationship_tuples` table. All the data in the column will be lost.
  - You are about to drop the column `objectType` on the `user_relationship_tuples` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `user_relationship_tuples` table. All the data in the column will be lost.
  - You are about to drop the column `subjectType` on the `user_relationship_tuples` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_revoked_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `user_revoked_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_revoked_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `user_sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subject_type,subject_id,relation,object_type,object_id]` on the table `user_relationship_tuples` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `object_id` to the `user_relationship_tuples` table without a default value. This is not possible if the table is not empty.
  - Added the required column `object_type` to the `user_relationship_tuples` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `user_relationship_tuples` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_type` to the `user_relationship_tuples` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `user_revoked_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_revoked_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_revoked_tokens" DROP CONSTRAINT "user_revoked_tokens_userId_fkey";

-- DropIndex
DROP INDEX "user_relationship_tuples_objectType_objectId_relation_idx";

-- DropIndex
DROP INDEX "user_relationship_tuples_subjectType_subjectId_relation_idx";

-- DropIndex
DROP INDEX "user_relationship_tuples_subjectType_subjectId_relation_obj_key";

-- DropIndex
DROP INDEX "user_revoked_tokens_expiresAt_idx";


ALTER TABLE "user_relationship_tuples" RENAME COLUMN "objectId" TO "object_id";
ALTER TABLE "user_relationship_tuples" RENAME COLUMN "objectType" TO "object_type";
ALTER TABLE "user_relationship_tuples" RENAME COLUMN "subjectId" TO "subject_id";
ALTER TABLE "user_relationship_tuples" RENAME COLUMN "subjectType" TO "subject_type";


ALTER TABLE "user_revoked_tokens" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "user_revoked_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "user_revoked_tokens" RENAME COLUMN "userId" TO "user_id";

-- AlterTable
ALTER TABLE "user_sessions" DROP COLUMN "country";

-- CreateIndex
CREATE INDEX "user_relationship_tuples_subject_type_subject_id_relation_idx" ON "user_relationship_tuples"("subject_type", "subject_id", "relation");

-- CreateIndex
CREATE INDEX "user_relationship_tuples_object_type_object_id_relation_idx" ON "user_relationship_tuples"("object_type", "object_id", "relation");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationship_tuples_subject_type_subject_id_relation_o_key" ON "user_relationship_tuples"("subject_type", "subject_id", "relation", "object_type", "object_id");

-- CreateIndex
CREATE INDEX "user_revoked_tokens_expires_at_idx" ON "user_revoked_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "user_revoked_tokens" ADD CONSTRAINT "user_revoked_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
