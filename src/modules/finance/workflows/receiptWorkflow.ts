import { onEvent } from "@/modules/kernel/workflows";
import { suggestReceiptCategorisation } from "@/modules/kernel/ai";
import { db } from "@/lib/db";
import { updateReceipt } from "../services/receipts";

async function handleNewReceipt(event: { payload: { receiptId: string } }) {
  const { receiptId } = event.payload;

  try {
    const receipt = await db.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) return;

    const suggestion = await suggestReceiptCategorisation({
      text: `Receipt from ${receipt.vendorName} for €${receipt.grossAmount}`,
      amount: Number(receipt.grossAmount),
      vendor: receipt.vendorName,
    });

    await updateReceipt(receipt.spaceId, receiptId, {
      category: suggestion.category,
      vatRate: suggestion.vatRate,
    });

    await db.inboxItem.create({
      data: {
        spaceId: receipt.spaceId,
        type: "RECEIPT_REVIEW",
        title: `Review receipt: ${receipt.vendorName}`,
        description: `AI suggested category: ${suggestion.category} (${suggestion.explanation})`,
        relatedEntityType: "Receipt",
        relatedEntityId: receiptId,
        status: "OPEN",
      },
    });
  } catch (error) {
    console.error("Receipt workflow error:", error);
  }
}

async function handleReceiptConfirmed(event: { payload: { receiptId: string } }) {
  const { receiptId } = event.payload;

  try {
    const receipt = await db.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) return;

    await db.inboxItem.updateMany({
      where: {
        spaceId: receipt.spaceId,
        relatedEntityType: "Receipt",
        relatedEntityId: receiptId,
        status: "OPEN",
      },
      data: {
        status: "RESOLVED",
      },
    });
  } catch (error) {
    console.error("Receipt confirmation workflow error:", error);
  }
}

onEvent("receipt.created", handleNewReceipt);
onEvent("receipt.confirmed", handleReceiptConfirmed);
