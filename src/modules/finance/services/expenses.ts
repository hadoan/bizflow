import { db } from "@/lib/db";
import type { CreateExpenseInput, ExpenseFilters } from "../entities/expenses";
import { getDocumentSettings } from "@/modules/documents/services";

export async function createExpense(spaceId: string, input: CreateExpenseInput) {
  const space = await db.space.findUnique({
    where: { id: spaceId },
    select: { currency: true },
  });
  if (!space) {
    throw new Error("Space not found");
  }

  const baseCurrency = space.currency;
  const amount = input.amount;
  const currency = input.currency ?? baseCurrency;
  const fxRate =
    currency === baseCurrency
      ? 1
      : input.fxRate && input.fxRate > 0
        ? input.fxRate
        : undefined;
  const baseAmount =
    currency === baseCurrency || !fxRate ? amount : Math.round((amount * fxRate + Number.EPSILON) * 100) / 100;

  return db.expense.create({
    data: {
      spaceId,
      vendor: input.vendor,
      category: input.category,
      amount,
      currency,
      baseAmount: baseAmount ?? amount,
      baseCurrency,
      fxRate: fxRate ?? (currency === baseCurrency ? 1 : null),
      date: input.date,
      taxAmount: input.taxAmount,
      projectLink: input.projectLink,
      billable: input.billable ?? false,
      notes: input.notes,
    },
  });
}

export async function listExpenses(spaceId: string, filters?: ExpenseFilters) {
  const where: any = { spaceId };
  if (filters?.category) where.category = filters.category;
  if (filters?.projectLink) where.projectLink = filters.projectLink;
  if (filters?.fromDate || filters?.toDate) {
    where.date = {};
    if (filters.fromDate) where.date.gte = filters.fromDate;
    if (filters.toDate) where.date.lte = filters.toDate;
  }

  return db.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });
}
