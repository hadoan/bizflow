import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

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

// Invoice filters schema for query parameters
export const invoiceFiltersSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  period: z.string().optional(), // Format: "YYYY-MM" or "YYYY"
});

// Type exports
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;