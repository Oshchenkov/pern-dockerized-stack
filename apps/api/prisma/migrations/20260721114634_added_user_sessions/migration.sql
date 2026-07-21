-- DropForeignKey
ALTER TABLE "user_profiles" 
DROP CONSTRAINT "user_profiles_user_id_fkey";

-- AlterTable
ALTER TABLE "users" 
ALTER COLUMN "is_active" 
SET DEFAULT false;

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "country" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_hash_key" 
ON "user_sessions"("token_hash");

-- AddForeignKey
ALTER TABLE "user_profiles" 
ADD CONSTRAINT "user_profiles_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "users"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" 
ADD CONSTRAINT "user_sessions_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "users"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;
