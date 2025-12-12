import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { emitEvent } from "@/modules/kernel/workflows";
import {
  createReceipt,
  createReceiptFromUpload,
  listReceipts,
  getReceipt,
  updateReceipt,
  confirmReceipt,
  deleteReceipt,
} from "@/modules/finance/services/receipts";
import { ReceiptStatus } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    receipt: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/modules/kernel/workflows", () => ({
  emitEvent: vi.fn(),
}));

describe("Receipt Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createReceipt", () => {
    it("should create a receipt with calculated amounts", async () => {
      const mockReceipt = {
        id: "rec-1",
        spaceId: "space-1",
        vendorName: "Vendor Inc",
        documentDate: new Date("2024-01-01"),
        currency: "EUR",
        grossAmount: 119,
        netAmount: 100,
        vatAmount: 19,
        vatRate: 0.19,
        category: "Office Supplies",
        fileId: "file-1",
        status: ReceiptStatus.PENDING_REVIEW,
        source: "UPLOAD",
      };

      (db.receipt.create as any).mockResolvedValue(mockReceipt);

      const input = {
        vendorName: "Vendor Inc",
        documentDate: new Date("2024-01-01"),
        grossAmount: 119,
        vatRate: 0.19,
        category: "Office Supplies",
        fileId: "file-1",
      };

      const result = await createReceipt("space-1", input);

      expect(db.receipt.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          vendorName: "Vendor Inc",
          documentDate: new Date("2024-01-01"),
          currency: "EUR",
          grossAmount: 119,
          netAmount: 100,
          vatAmount: 19,
          vatRate: 0.19,
          category: "Office Supplies",
          fileId: "file-1",
          status: ReceiptStatus.PENDING_REVIEW,
          source: "UPLOAD",
        },
      });

      expect(emitEvent).toHaveBeenCalledWith("receipt.created", "space-1", {
        receiptId: "rec-1",
      });

      expect(result).toEqual(mockReceipt);
    });

    it("should use default VAT rate when not provided", async () => {
      const mockReceipt = {
        id: "rec-1",
        spaceId: "space-1",
        vendorName: "Vendor Inc",
        documentDate: new Date("2024-01-01"),
        currency: "EUR",
        grossAmount: 119,
        netAmount: 100,
        vatAmount: 19,
        vatRate: 0.19,
        status: ReceiptStatus.PENDING_REVIEW,
        source: "UPLOAD",
      };

      (db.receipt.create as any).mockResolvedValue(mockReceipt);

      const input = {
        vendorName: "Vendor Inc",
        documentDate: new Date("2024-01-01"),
        grossAmount: 119,
      };

      const result = await createReceipt("space-1", input);

      expect(db.receipt.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          vendorName: "Vendor Inc",
          documentDate: new Date("2024-01-01"),
          currency: "EUR",
          grossAmount: 119,
          netAmount: 100,
          vatAmount: 19,
          vatRate: 0.19,
          status: ReceiptStatus.PENDING_REVIEW,
          source: "UPLOAD",
        },
      });

      expect(result).toEqual(mockReceipt);
    });
  });

  describe("createReceiptFromUpload", () => {
    it("should create receipt from upload metadata", async () => {
      const mockReceipt = {
        id: "rec-1",
        spaceId: "space-1",
        vendorName: "Vendor Inc",
        documentDate: new Date("2024-01-01"),
        currency: "EUR",
        grossAmount: 119,
        netAmount: 100,
        vatAmount: 19,
        vatRate: 0.19,
        category: "Office Supplies",
        fileId: "file-1",
        status: ReceiptStatus.PENDING_REVIEW,
        source: "UPLOAD",
      };

      (db.receipt.create as any).mockResolvedValue(mockReceipt);

      const metadata = {
        vendorName: "Vendor Inc",
        documentDate: new Date("2024-01-01"),
        grossAmount: 119,
        vatRate: 0.19,
        category: "Office Supplies",
      };

      const result = await createReceiptFromUpload("space-1", "file-1", metadata);

      expect(db.receipt.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          vendorName: "Vendor Inc",
          documentDate: new Date("2024-01-01"),
          currency: "EUR",
          grossAmount: 119,
          netAmount: 100,
          vatAmount: 19,
          vatRate: 0.19,
          category: "Office Supplies",
          fileId: "file-1",
          status: ReceiptStatus.PENDING_REVIEW,
          source: "UPLOAD",
        },
      });

      expect(result).toEqual(mockReceipt);
    });
  });

  describe("listReceipts", () => {
    it("should list receipts with filters", async () => {
      const mockReceipts = [
        {
          id: "rec-1",
          spaceId: "space-1",
          status: ReceiptStatus.PENDING_REVIEW,
          category: "Office Supplies",
        },
      ];

      (db.receipt.findMany as any).mockResolvedValue(mockReceipts);

      const filters = {
        status: ReceiptStatus.PENDING_REVIEW,
        category: "Office Supplies",
        fromDate: new Date("2024-01-01"),
      };

      const result = await listReceipts("space-1", filters);

      expect(db.receipt.findMany).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          status: ReceiptStatus.PENDING_REVIEW,
          category: "Office Supplies",
          documentDate: { gte: new Date("2024-01-01") },
        },
        orderBy: {
          documentDate: "desc",
        },
      });

      expect(result).toEqual(mockReceipts);
    });
  });

  describe("getReceipt", () => {
    it("should get a specific receipt", async () => {
      const mockReceipt = {
        id: "rec-1",
        spaceId: "space-1",
        vendorName: "Vendor Inc",
      };

      (db.receipt.findFirst as any).mockResolvedValue(mockReceipt);

      const result = await getReceipt("space-1", "rec-1");

      expect(db.receipt.findFirst).toHaveBeenCalledWith({
        where: {
          id: "rec-1",
          spaceId: "space-1",
        },
      });

      expect(result).toEqual(mockReceipt);
    });
  });

  describe("updateReceipt", () => {
    it("should update receipt fields", async () => {
      const mockReceipt = {
        id: "rec-1",
        spaceId: "space-1",
        vendorName: "Updated Vendor",
        grossAmount: 238,
        netAmount: 200,
        vatAmount: 38,
        vatRate: 0.19,
      };

      (db.receipt.update as any).mockResolvedValue(mockReceipt);

      const updates = {
        vendorName: "Updated Vendor",
        grossAmount: 238,
        vatRate: 0.19,
      };

      const result = await updateReceipt("space-1", "rec-1", updates);

      expect(db.receipt.update).toHaveBeenCalledWith({
        where: {
          id: "rec-1",
          spaceId: "space-1",
        },
        data: {
          vendorName: "Updated Vendor",
          grossAmount: 238,
          netAmount: 200,
          vatAmount: 38,
          vatRate: 0.19,
        },
      });

      expect(result).toEqual(mockReceipt);
    });
  });

  describe("confirmReceipt", () => {
    it("should confirm a receipt and emit event", async () => {
      const mockReceipt = {
        id: "rec-1",
        spaceId: "space-1",
        status: ReceiptStatus.CONFIRMED,
      };

      (db.receipt.update as any).mockResolvedValue(mockReceipt);

      const result = await confirmReceipt("space-1", "rec-1");

      expect(db.receipt.update).toHaveBeenCalledWith({
        where: {
          id: "rec-1",
          spaceId: "space-1",
        },
        data: {
          status: ReceiptStatus.CONFIRMED,
        },
      });

      expect(emitEvent).toHaveBeenCalledWith("receipt.confirmed", "space-1", {
        receiptId: "rec-1",
      });

      expect(result).toEqual(mockReceipt);
    });
  });

  describe("deleteReceipt", () => {
    it("should delete a receipt", async () => {
      (db.receipt.delete as any).mockResolvedValue(undefined);

      await deleteReceipt("space-1", "rec-1");

      expect(db.receipt.delete).toHaveBeenCalledWith({
        where: {
          id: "rec-1",
          spaceId: "space-1",
        },
      });
    });
  });
});