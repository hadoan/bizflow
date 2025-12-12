import { db } from "@/lib/db";
import { emitEvent } from "@/modules/kernel/workflows";
import type { TaxOverview } from "../entities";
import { TaxPeriodType, TaxPeriodStatus, InvoiceStatus, ReceiptStatus } from "@prisma/client";

export async function getTaxConfig(spaceId: string) {
  let config = await db.taxConfig.findUnique({
    where: { spaceId },
  });

  if (!config) {
    config = await db.taxConfig.create({
      data: {
        spaceId,
        isKleinunternehmer: false,
        vatFrequency: "QUARTERLY",
      },
    });
  }

  return config;
}

export async function updateTaxConfig(
  spaceId: string,
  updates: {
    isKleinunternehmer?: boolean;
    vatFrequency?: "MONTHLY" | "QUARTERLY" | "YEARLY";
    taxNumber?: string;
    vatId?: string;
  }
) {
  return await db.taxConfig.upsert({
    where: { spaceId },
    update: updates,
    create: {
      spaceId,
      ...updates,
    },
  });
}

export async function getTaxOverview(
  spaceId: string,
  year: number,
  periodType: TaxPeriodType,
  periodValue: number
): Promise<TaxOverview> {
  const { startDate, endDate } = getPeriodDates(year, periodType, periodValue);

  const [invoices, receipts] = await Promise.all([
    db.invoice.findMany({
      where: {
        spaceId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PAID],
        },
      },
    }),
    db.receipt.findMany({
      where: {
        spaceId,
        documentDate: {
          gte: startDate,
          lte: endDate,
        },
        status: ReceiptStatus.CONFIRMED,
      },
    }),
  ]);

  const income = invoices.reduce((sum, inv) => sum + Number(inv.netAmount), 0);
  const vatCollected = invoices.reduce((sum, inv) => sum + Number(inv.vatAmount), 0);
  const expenses = receipts.reduce((sum, rec) => sum + Number(rec.netAmount), 0);
  const vatPaid = receipts.reduce((sum, rec) => sum + Number(rec.vatAmount), 0);
  const vatDue = vatCollected - vatPaid;
  const netProfit = income - expenses;

  return {
    period: {
      year,
      type: periodType,
      value: periodValue,
    },
    income,
    expenses,
    vatCollected,
    vatPaid,
    vatDue,
    netProfit,
  };
}

export async function updateTaxPeriodDraft(
  spaceId: string,
  year: number,
  periodType: TaxPeriodType,
  periodValue: number
): Promise<void> {
  const overview = await getTaxOverview(spaceId, year, periodType, periodValue);

  await db.taxPeriod.upsert({
    where: {
      spaceId_year_periodType_periodValue: {
        spaceId,
        year,
        periodType,
        periodValue,
      },
    },
    update: {
      income: overview.income,
      expenses: overview.expenses,
      vatDue: overview.vatDue,
      status: TaxPeriodStatus.DRAFT,
    },
    create: {
      spaceId,
      year,
      periodType,
      periodValue,
      income: overview.income,
      expenses: overview.expenses,
      vatDue: overview.vatDue,
      status: TaxPeriodStatus.DRAFT,
    },
  });

  await emitEvent("tax_period.updated", spaceId, { year, periodType, periodValue });
}

export async function closeTaxPeriod(
  spaceId: string,
  year: number,
  periodType: TaxPeriodType,
  periodValue: number
) {
  return await db.taxPeriod.update({
    where: {
      spaceId_year_periodType_periodValue: {
        spaceId,
        year,
        periodType,
        periodValue,
      },
    },
    data: {
      status: TaxPeriodStatus.CLOSED,
    },
  });
}

export async function getTaxPeriods(spaceId: string, year?: number) {
  const where: any = { spaceId };
  if (year) {
    where.year = year;
  }

  return await db.taxPeriod.findMany({
    where,
    orderBy: [{ year: "desc" }, { periodValue: "desc" }],
  });
}

function getPeriodDates(
  year: number,
  periodType: TaxPeriodType,
  periodValue: number
): { startDate: Date; endDate: Date } {
  let startDate: Date;
  let endDate: Date;

  if (periodType === TaxPeriodType.MONTH) {
    startDate = new Date(year, periodValue - 1, 1);
    endDate = new Date(year, periodValue, 0, 23, 59, 59);
  } else if (periodType === TaxPeriodType.QUARTER) {
    const startMonth = (periodValue - 1) * 3;
    startDate = new Date(year, startMonth, 1);
    endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  }

  return { startDate, endDate };
}
