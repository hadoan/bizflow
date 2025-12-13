import { db } from "@/lib/db";
import type { DocumentSettings, UpdateDocumentSettingsInput } from "../entities/settings";

const DEFAULT_SETTINGS: Omit<DocumentSettings, "id" | "spaceId" | "createdAt" | "updatedAt"> = {
  invoicePrefix: "INV-",
  invoiceNextNumber: 1,
  invoiceYearlyReset: true,
  invoiceLastYear: null,
  quotePrefix: "QUO-",
  quoteNextNumber: 1,
  quoteYearlyReset: true,
  quoteLastYear: null,
  defaultPaymentTerms: 14,
  defaultFooter: "",
  defaultTerms: "",
  defaultLanguage: "en-US",
};

export async function getDocumentSettings(spaceId: string): Promise<DocumentSettings> {
  let settings = await db.documentSettings.findUnique({ where: { spaceId } });
  if (!settings) {
    settings = await db.documentSettings.create({
      data: {
        spaceId,
        ...DEFAULT_SETTINGS,
      },
    });
  }
  return settings;
}

export async function updateDocumentSettings(
  spaceId: string,
  input: UpdateDocumentSettingsInput
): Promise<DocumentSettings> {
  await getDocumentSettings(spaceId); // ensure exists
  return db.documentSettings.update({
    where: { spaceId },
    data: {
      invoicePrefix: input.invoicePrefix,
      invoiceNextNumber: input.invoiceNextNumber,
      invoiceYearlyReset: input.invoiceYearlyReset,
      quotePrefix: input.quotePrefix,
      quoteNextNumber: input.quoteNextNumber,
      quoteYearlyReset: input.quoteYearlyReset,
      defaultPaymentTerms: input.defaultPaymentTerms,
      defaultFooter: input.defaultFooter,
      defaultTerms: input.defaultTerms,
      defaultLanguage: input.defaultLanguage,
    },
  });
}
