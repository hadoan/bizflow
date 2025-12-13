import { BusinessIdentity } from "@prisma/client";

export type { BusinessIdentity };

export interface UpsertBusinessIdentityInput {
  id?: string;
  legalName: string;
  tradeName?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressCountry?: string;
  vatId?: string;
  taxNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWebsite?: string;
  logoUrl?: string | null;
  paymentInstructions?: string;
  isDefault?: boolean;
}

export interface BusinessIdentityResponse {
  identity: BusinessIdentity;
  warnings?: string[];
}
