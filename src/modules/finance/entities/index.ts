import {
  Invoice,
  InvoiceLineItem,
  Receipt,
  TaxConfig,
  TaxPeriod,
  InvoiceStatus,
  ReceiptStatus,
  VatFrequency,
  TaxPeriodType,
  TaxPeriodStatus,
} from "@prisma/client";

export type {
  Invoice,
  InvoiceLineItem,
  Receipt,
  TaxConfig,
  TaxPeriod,
  InvoiceStatus,
  ReceiptStatus,
  VatFrequency,
  TaxPeriodType,
  TaxPeriodStatus,
};

// Domain type aliases
export type FinanceInvoice = Invoice;
export type FinanceReceipt = Receipt;
export type FinanceInvoiceLineItem = InvoiceLineItem;

export interface InvoiceWithLineItems extends Invoice {
  lineItems: InvoiceLineItem[];
}

export interface CreateInvoiceInput {
  clientId: string;
  number: string;
  issueDate: Date;
  dueDate: Date;
  currency?: string;
  lineItems: CreateInvoiceLineItemInput[];
}

export interface CreateInvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface CreateReceiptInput {
  vendorName: string;
  documentDate: Date;
  grossAmount: number;
  currency?: string;
  category?: string;
  fileId?: string;
  vatRate?: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ReceiptFilters {
  status?: ReceiptStatus;
  category?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface TaxOverview {
  period: {
    year: number;
    type: TaxPeriodType;
    value: number;
  };
  income: number;
  expenses: number;
  vatCollected: number;
  vatPaid: number;
  vatDue: number;
  netProfit: number;
}
