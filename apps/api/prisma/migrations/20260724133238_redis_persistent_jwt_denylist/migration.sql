-- AddForeignKey
ALTER TABLE "user_revoked_tokens" ADD CONSTRAINT "user_revoked_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
