import { onEvent } from "@/modules/kernel/workflows";
import { suggestReceiptCategorisation } from "@/modules/kernel/ai";
import { db } from "@/lib/db";

export async function handleNewReceipt(event: { payload: { receiptId: string } }) {
  const { receiptId } = event.payload;

  try {
    const receipt = await db.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) return;

    let suggestion;
    try {
      suggestion = await suggestReceiptCategorisation({
        text: `Receipt from ${receipt.vendorName} for €${receipt.grossAmount}`,
        amount: Number(receipt.grossAmount),
        vendor: receipt.vendorName,
      });
    } catch (aiError) {
      console.error("AI categorization failed:", aiError);
      // Fallback suggestion
      suggestion = {
        category: "Other" as const,
        vatRate: 0.19,
        explanation: "Fallback categorization (AI unavailable)",
      };
    }

    // Store the AI suggestion in the InboxItem, don't update the receipt yet
    await db.inboxItem.create({
      data: {
        spaceId: receipt.spaceId,
        type: "RECEIPT_REVIEW",
        title: `Review receipt: ${receipt.vendorName}`,
        description: `AI suggests: ${suggestion.category} (${suggestion.explanation}). Amount: €${receipt.grossAmount}`,
        relatedEntityType: "Receipt",
        relatedEntityId: receiptId,
        status: "OPEN",
        metadata: {
          aiSuggestion: {
            category: suggestion.category,
            vatRate: suggestion.vatRate,
            explanation: suggestion.explanation,
          },
        },
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
