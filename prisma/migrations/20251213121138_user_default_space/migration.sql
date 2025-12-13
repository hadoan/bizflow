-- AlterTable
ALTER TABLE "users" ADD COLUMN     "defaultSpaceId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultSpaceId_fkey" FOREIGN KEY ("defaultSpaceId") REFERENCES "spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
