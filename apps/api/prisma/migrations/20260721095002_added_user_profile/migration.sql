/*
  Warnings:

  - You are about to drop the column `avatar_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `users` table. All the data in the column will be lost.

*/


-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Copy the existing data from the users table to the new table
INSERT INTO "user_profiles" ("user_id", "name", "surname", "avatar_url")
SELECT "id", "name", "surname", "avatar_url"
FROM "users";

-- AlterTable DROP
ALTER TABLE "users" DROP COLUMN "avatar_url",
DROP COLUMN "name",
DROP COLUMN "surname";