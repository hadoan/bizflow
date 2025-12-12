import { z } from "zod";
import { InvoiceStatus, ReceiptStatus, TaxPeriodType } from "@prisma/client";

// Invoice line item schema
export const createInvoiceLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  vatRate: z.number().min(0).max(1, "VAT rate must be between 0 and 1"),
});

// Create invoice schema
export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  number: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  currency: z.string().optional().default("EUR"),
  lineItems: z.array(createInvoiceLineItemSchema).min(1, "At least one line item is required"),
});

// Receipt upload schema
export const createReceiptFromUploadSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  vendorName: z.string().min(1, "Vendor name is required"),
  documentDate: z.string().transform((str) => new Date(str)),
  grossAmount: z.number().positive("Gross amount must be positive"),
  currency: z.string().optional().default("EUR"),
  category: z.string().optional(),
  vatRate: z.number().min(0).max(1, "VAT rate must be between 0 and 1").optional().default(0.19),
});

// Receipt filters schema for query parameters
export const receiptFiltersSchema = z.object({
  status: z.nativeEnum(ReceiptStatus).optional(),
  category: z.string().optional(),
  period: z.string().optional(), // Format: "YYYY-MM" or "YYYY"
});

// Invoice filters schema for query parameters
export const invoiceFiltersSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  period: z.string().optional(), // Format: "YYYY-MM" or "YYYY"
});

// Type exports
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreateReceiptFromUploadInput = z.infer<typeof createReceiptFromUploadSchema>;
export type ReceiptFilters = z.infer<typeof receiptFiltersSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;

// Tax overview schema for query parameters
export const taxOverviewQuerySchema = z.object({
  year: z.string().transform((str) => parseInt(str)),
  periodType: z.nativeEnum(TaxPeriodType),
  periodValue: z.string().transform((str) => parseInt(str)),
});

// Tax overview schema for JSON body
export const taxOverviewBodySchema = z.object({
  year: z.number().int().positive(),
  periodType: z.nativeEnum(TaxPeriodType),
  periodValue: z.number().int().positive(),
});

export type TaxOverviewQuery = z.infer<typeof taxOverviewQuerySchema>;
export type TaxOverviewBody = z.infer<typeof taxOverviewBodySchema>;