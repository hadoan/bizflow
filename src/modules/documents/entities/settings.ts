import { DocumentSettings } from "@prisma/client";

export type { DocumentSettings };

export interface UpdateDocumentSettingsInput {
  invoicePrefix?: string;
  invoiceNextNumber?: number;
  invoiceYearlyReset?: boolean;
  quotePrefix?: string;
  quoteNextNumber?: number;
  quoteYearlyReset?: boolean;
  defaultPaymentTerms?: number;
  defaultFooter?: string;
  defaultTerms?: string;
  defaultLanguage?: string;
}
