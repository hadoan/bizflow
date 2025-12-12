import { db } from "@/lib/db";
import { calculateNet, calculateVAT } from "@/lib/utils";
import { emitEvent } from "@/modules/kernel/workflows";
import type { CreateReceiptInput, ReceiptFilters } from "../entities";
import { Receipt, ReceiptStatus } from "@prisma/client";

export async function createReceipt(
  spaceId: string,
  input: CreateReceiptInput
): Promise<Receipt> {
  const netAmount = input.grossAmount / (1 + (input.vatRate ?? 0.19));
  const vatAmount = input.grossAmount - netAmount;

  const receipt = await db.receipt.create({
    data: {
      spaceId,
      vendorName: input.vendorName,
      documentDate: input.documentDate,
      currency: input.currency ?? "EUR",
      grossAmount: input.grossAmount,
      netAmount,
      vatAmount,
      vatRate: input.vatRate ?? 0.19,
      category: input.category,
      fileId: input.fileId,
      status: ReceiptStatus.PENDING_REVIEW,
      source: "UPLOAD",
    },
  });

  await emitEvent("receipt.created", spaceId, { receiptId: receipt.id });

  return receipt;
}

export async function createReceiptFromUpload(
  spaceId: string,
  fileId: string,
  metadata: {
    vendorName: string;
    documentDate: Date;
    grossAmount: number;
    vatRate?: number;
    category?: string;
  }
): Promise<Receipt> {
  return createReceipt(spaceId, {
    ...metadata,
    fileId,
  });
}

export async function listReceipts(
  spaceId: string,
  filters?: ReceiptFilters
): Promise<Receipt[]> {
  const where: any = { spaceId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.fromDate || filters?.toDate) {
    where.documentDate = {};
    if (filters.fromDate) {
      where.documentDate.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.documentDate.lte = filters.toDate;
    }
  }

  return await db.receipt.findMany({
    where,
    orderBy: {
      documentDate: "desc",
    },
  });
}

export async function getReceipt(spaceId: string, receiptId: string): Promise<Receipt | null> {
  return await db.receipt.findFirst({
    where: {
      id: receiptId,
      spaceId,
    },
  });
}

export async function updateReceipt(
  spaceId: string,
  receiptId: string,
  updates: Partial<CreateReceiptInput>
): Promise<Receipt> {
  const data: any = {};

  if (updates.vendorName) data.vendorName = updates.vendorName;
  if (updates.documentDate) data.documentDate = updates.documentDate;
  if (updates.category) data.category = updates.category;

  if (updates.grossAmount !== undefined) {
    const vatRate = updates.vatRate ?? 0.19;
    const netAmount = calculateNet(updates.grossAmount, vatRate);
    const vatAmount = calculateVAT(netAmount, vatRate);

    data.grossAmount = updates.grossAmount;
    data.netAmount = netAmount;
    data.vatAmount = vatAmount;
    data.vatRate = vatRate;
  }

  return await db.receipt.update({
    where: {
      id: receiptId,
      spaceId,
    },
    data,
  });
}

export async function confirmReceipt(spaceId: string, receiptId: string): Promise<Receipt> {
  const receipt = await db.receipt.update({
    where: {
      id: receiptId,
      spaceId,
    },
    data: {
      status: ReceiptStatus.CONFIRMED,
    },
  });

  await emitEvent("receipt.confirmed", spaceId, { receiptId: receipt.id });

  return receipt;
}

export async function deleteReceipt(spaceId: string, receiptId: string): Promise<void> {
  await db.receipt.delete({
    where: {
      id: receiptId,
      spaceId,
    },
  });
}
