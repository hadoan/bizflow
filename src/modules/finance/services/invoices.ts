import { db } from "@/lib/db";
import { calculateVAT, calculateGross } from "@/lib/utils";
import { emitEvent } from "@/modules/kernel/workflows";
import type { CreateInvoiceInput, InvoiceWithLineItems, InvoiceFilters } from "../entities";
import { InvoiceStatus } from "@prisma/client";

export async function createInvoice(
  spaceId: string,
  input: CreateInvoiceInput
): Promise<InvoiceWithLineItems> {
  let totalNet = 0;
  let totalVat = 0;

  const lineItemsData = input.lineItems.map((item) => {
    const netAmount = item.quantity * item.unitPrice;
    const vatAmount = calculateVAT(netAmount, item.vatRate);
    const grossAmount = calculateGross(netAmount, item.vatRate);

    totalNet += netAmount;
    totalVat += vatAmount;

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      netAmount,
      vatAmount,
      grossAmount,
    };
  });

  const invoice = await db.invoice.create({
    data: {
      spaceId,
      clientId: input.clientId,
      number: input.number,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency ?? "EUR",
      netAmount: totalNet,
      vatAmount: totalVat,
      grossAmount: totalNet + totalVat,
      status: InvoiceStatus.DRAFT,
      lineItems: {
        create: lineItemsData,
      },
    },
    include: {
      lineItems: true,
    },
  });

  await emitEvent("invoice.created", spaceId, { invoiceId: invoice.id });

  return invoice;
}

export async function listInvoices(
  spaceId: string,
  filters?: InvoiceFilters
): Promise<InvoiceWithLineItems[]> {
  const where: any = { spaceId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters?.fromDate || filters?.toDate) {
    where.issueDate = {};
    if (filters.fromDate) {
      where.issueDate.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.issueDate.lte = filters.toDate;
    }
  }

  return await db.invoice.findMany({
    where,
    include: {
      lineItems: true,
      client: true,
    },
    orderBy: {
      issueDate: "desc",
    },
  });
}

export async function getInvoice(
  spaceId: string,
  invoiceId: string
): Promise<InvoiceWithLineItems | null> {
  return await db.invoice.findFirst({
    where: {
      id: invoiceId,
      spaceId,
    },
    include: {
      lineItems: true,
      client: true,
    },
  });
}

export async function updateInvoiceStatus(
  spaceId: string,
  invoiceId: string,
  status: InvoiceStatus
): Promise<InvoiceWithLineItems> {
  const invoice = await db.invoice.update({
    where: {
      id: invoiceId,
      spaceId,
    },
    data: {
      status,
    },
    include: {
      lineItems: true,
    },
  });

  if (status === InvoiceStatus.SENT) {
    await emitEvent("invoice.sent", spaceId, { invoiceId: invoice.id });
  } else if (status === InvoiceStatus.PAID) {
    await emitEvent("invoice.paid", spaceId, { invoiceId: invoice.id });
  }

  return invoice;
}

export async function deleteInvoice(spaceId: string, invoiceId: string): Promise<void> {
  await db.invoice.delete({
    where: {
      id: invoiceId,
      spaceId,
    },
  });
}

export async function generateInvoiceNumber(spaceId: string, year?: number): Promise<string> {
  const currentYear = year ?? new Date().getFullYear();
  const yearPrefix = currentYear.toString();

  const lastInvoice = await db.invoice.findFirst({
    where: {
      spaceId,
      number: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      number: "desc",
    },
  });

  if (!lastInvoice) {
    return `${yearPrefix}-001`;
  }

  const lastNumber = parseInt(lastInvoice.number.split("-")[1] ?? "0");
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

  return `${yearPrefix}-${nextNumber}`;
}
