-- CreateTable
CREATE TABLE "business_identities" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "addressStreet" TEXT,
    "addressZip" TEXT,
    "addressCity" TEXT,
    "addressCountry" TEXT,
    "vatId" TEXT,
    "taxNumber" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactWebsite" TEXT,
    "logoUrl" TEXT,
    "paymentInstructions" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_identity_space_default_idx" ON "business_identities"("spaceId", "isDefault");

-- AddForeignKey
ALTER TABLE "business_identities" ADD CONSTRAINT "business_identities_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
