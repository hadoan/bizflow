-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'FINAL');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "agentMetadata" JSONB,
ADD COLUMN     "fileId" TEXT,
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'FINAL';

-- CreateIndex
CREATE INDEX "expense_space_status_idx" ON "expenses"("spaceId", "status");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
