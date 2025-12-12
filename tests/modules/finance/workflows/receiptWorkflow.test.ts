import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReceipt } from "@/modules/finance/services/receipts";
import { db } from "@/lib/db";
import { suggestReceiptCategorisation } from "@/modules/kernel/ai/receiptCategorisation";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    receipt: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    inboxItem: {
      create: vi.fn(),
    },
  },
}));

// Mock the AI categorization
vi.mock("@/modules/kernel/ai/receiptCategorisation", () => ({
  suggestReceiptCategorisation: vi.fn(),
}));

// Mock the event emission
vi.mock("@/modules/kernel/workflows", () => ({
  emitEvent: vi.fn(),
  onEvent: vi.fn(),
}));

import { emitEvent } from "@/modules/kernel/workflows";

describe("Receipt Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReceipt", () => {
    it("should create a receipt and emit event", async () => {
      const mockReceipt = {
        id: "receipt-123",
        spaceId: "space-123",
        vendorName: "Test Vendor",
        grossAmount: 100,
        vatRate: 0.19,
        status: "PENDING_REVIEW",
      };

      (db.receipt.create as any).mockResolvedValue(mockReceipt);

      const result = await createReceipt("space-123", {
        vendorName: "Test Vendor",
        documentDate: new Date(),
        grossAmount: 100,
        vatRate: 0.19,
      });

      expect(db.receipt.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-123",
          vendorName: "Test Vendor",
          documentDate: expect.any(Date),
          currency: "EUR",
          grossAmount: 100,
          netAmount: 100 / 1.19, // Calculated net amount
          vatAmount: 100 - (100 / 1.19), // Calculated VAT amount
          vatRate: 0.19,
          category: undefined,
          fileId: undefined,
          status: "PENDING_REVIEW",
          source: "UPLOAD",
        },
      });

      expect(emitEvent).toHaveBeenCalledWith("receipt.created", "space-123", {
        receiptId: "receipt-123",
      });

      expect(result).toBe(mockReceipt);
    });
  });

  describe("Receipt Workflow Handler", () => {
    it("should handle receipt.created event and create inbox item with AI suggestion", async () => {
      // Import the workflow handler directly
      const { handleNewReceipt } = await import("@/modules/finance/workflows/receiptWorkflow");

      // Mock the receipt lookup
      const mockReceipt = {
        id: "receipt-123",
        spaceId: "space-123",
        vendorName: "Deutsche Bahn",
        grossAmount: 45.5,
        documentDate: new Date(),
      };

      (db.receipt.findUnique as any).mockResolvedValue(mockReceipt);

      // Mock the AI suggestion
      const mockSuggestion = {
        category: "Transport",
        vatRate: 0.19,
        explanation: "Matched keyword \"bahn\" in vendor or text",
      };

      (suggestReceiptCategorisation as any).mockResolvedValue(mockSuggestion);

      // Call the handler directly
      await handleNewReceipt({ payload: { receiptId: "receipt-123" } });

      expect(db.receipt.findUnique).toHaveBeenCalledWith({
        where: { id: "receipt-123" },
      });

      expect(suggestReceiptCategorisation).toHaveBeenCalledWith({
        text: "Receipt from Deutsche Bahn for €45.5",
        amount: 45.5,
        vendor: "Deutsche Bahn",
      });

      expect(db.inboxItem.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-123",
          type: "RECEIPT_REVIEW",
          title: "Review receipt: Deutsche Bahn",
          description: "AI suggests: Transport (Matched keyword \"bahn\" in vendor or text). Amount: €45.5",
          relatedEntityType: "Receipt",
          relatedEntityId: "receipt-123",
          status: "OPEN",
          metadata: {
            aiSuggestion: {
              category: "Transport",
              vatRate: 0.19,
              explanation: "Matched keyword \"bahn\" in vendor or text",
            },
          },
        },
      });
    });

    it("should handle missing receipt gracefully", async () => {
      const { handleNewReceipt } = await import("@/modules/finance/workflows/receiptWorkflow");

      (db.receipt.findUnique as any).mockResolvedValue(null);

      // Call the handler directly
      await handleNewReceipt({ payload: { receiptId: "nonexistent" } });

      expect(db.receipt.findUnique).toHaveBeenCalledWith({
        where: { id: "nonexistent" },
      });

      // Should not create inbox item or call AI
      expect(suggestReceiptCategorisation).not.toHaveBeenCalled();
      expect(db.inboxItem.create).not.toHaveBeenCalled();
    });

    it("should handle AI categorization errors gracefully", async () => {
      const { handleNewReceipt } = await import("@/modules/finance/workflows/receiptWorkflow");

      const mockReceipt = {
        id: "receipt-123",
        spaceId: "space-123",
        vendorName: "Test Vendor",
        grossAmount: 100,
        documentDate: new Date(),
      };

      (db.receipt.findUnique as any).mockResolvedValue(mockReceipt);
      (suggestReceiptCategorisation as any).mockRejectedValue(new Error("AI failed"));

      // Call the handler directly
      await handleNewReceipt({ payload: { receiptId: "receipt-123" } });

      // Should still create inbox item with fallback information
      expect(db.inboxItem.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-123",
          type: "RECEIPT_REVIEW",
          title: "Review receipt: Test Vendor",
          description: "AI suggests: Other (Fallback categorization (AI unavailable)). Amount: €100",
          relatedEntityType: "Receipt",
          relatedEntityId: "receipt-123",
          status: "OPEN",
          metadata: {
            aiSuggestion: {
              category: "Other",
              vatRate: 0.19,
              explanation: "Fallback categorization (AI unavailable)",
            },
          },
        },
      });
    });
  });
});