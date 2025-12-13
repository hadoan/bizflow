-- CreateTable
CREATE TABLE "document_settings" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "invoiceNextNumber" INTEGER NOT NULL DEFAULT 1,
    "invoiceYearlyReset" BOOLEAN NOT NULL DEFAULT true,
    "invoiceLastYear" INTEGER,
    "quotePrefix" TEXT NOT NULL DEFAULT 'QUO-',
    "quoteNextNumber" INTEGER NOT NULL DEFAULT 1,
    "quoteYearlyReset" BOOLEAN NOT NULL DEFAULT true,
    "quoteLastYear" INTEGER,
    "defaultPaymentTerms" INTEGER NOT NULL DEFAULT 14,
    "defaultFooter" TEXT NOT NULL DEFAULT '',
    "defaultTerms" TEXT NOT NULL DEFAULT '',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en-US',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_settings_spaceId_key" ON "document_settings"("spaceId");

-- AddForeignKey
ALTER TABLE "document_settings" ADD CONSTRAINT "document_settings_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
