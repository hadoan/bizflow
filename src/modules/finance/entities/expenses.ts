import { Expense } from "@prisma/client";

export type { Expense };

export interface CreateExpenseInput {
  vendor: string;
  category: string;
  amount: number;
  currency?: string;
  date: Date;
  taxAmount?: number;
  projectLink?: string;
  billable?: boolean;
  notes?: string;
  fxRate?: number;
}

export interface ExpenseFilters {
  category?: string;
  projectLink?: string;
  fromDate?: Date;
  toDate?: Date;
}
