-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "fxRate" DECIMAL(12,6),
    "date" TIMESTAMP(3) NOT NULL,
    "taxAmount" DECIMAL(12,2),
    "projectLink" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_space_category_idx" ON "expenses"("spaceId", "category");

-- CreateIndex
CREATE INDEX "expense_space_project_idx" ON "expenses"("spaceId", "projectLink");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
