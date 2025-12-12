import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/receipts/route";
import { db } from "@/lib/db";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    receipt: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock the auth
vi.mock("@/lib/auth", () => ({
  getCurrentUserWithSpace: vi.fn(),
}));

// Mock the finance services
vi.mock("@/modules/finance/services", () => ({
  listReceipts: vi.fn(),
  createReceiptFromUpload: vi.fn(),
}));

import { getCurrentUserWithSpace } from "@/lib/auth";
import { listReceipts, createReceiptFromUpload } from "@/modules/finance/services";

describe("Receipts API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/receipts", () => {
    it("should return receipts with filters", async () => {
      const mockSpace = { id: "space-123" };
      const mockReceipts = [
        { id: "rec-1", vendorName: "Test Vendor", status: "PENDING_REVIEW" },
        { id: "rec-2", vendorName: "Another Vendor", status: "CONFIRMED" },
      ];

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (listReceipts as any).mockResolvedValue(mockReceipts);

      const request = new Request("http://localhost/api/receipts?status=PENDING_REVIEW&category=Transport");
      const response = await GET(request);

      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(listReceipts).toHaveBeenCalledWith("space-123", {
        status: "PENDING_REVIEW",
        category: "Transport",
      });

      const result = await response.json();
      expect(result).toEqual(mockReceipts);
      expect(response.status).toBe(200);
    });

    it("should handle year-only period filter", async () => {
      const mockSpace = { id: "space-123" };
      const mockReceipts = [{ id: "rec-1", vendorName: "Test Vendor" }];

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (listReceipts as any).mockResolvedValue(mockReceipts);

      const request = new Request("http://localhost/api/receipts?period=2025");
      const response = await GET(request);

      expect(listReceipts).toHaveBeenCalledWith("space-123", {
        fromDate: new Date(2025, 0, 1), // January 2025
        toDate: new Date(2025, 11, 31), // December 2025
      });

      expect(response.status).toBe(200);
    });

    it("should handle authentication errors", async () => {
      (getCurrentUserWithSpace as any).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost/api/receipts");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/receipts", () => {
    it("should create a receipt from upload with valid data", async () => {
      const mockSpace = { id: "space-123" };
      const mockReceipt = {
        id: "rec-123",
        vendorName: "Test Vendor",
        grossAmount: 100,
        status: "PENDING_REVIEW",
      };

      const requestBody = {
        fileId: "file-123",
        vendorName: "Test Vendor",
        documentDate: "2025-12-13",
        grossAmount: 100,
        vatRate: 0.19,
        category: "Office Supplies",
      };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (createReceiptFromUpload as any).mockResolvedValue(mockReceipt);

      const request = new Request("http://localhost/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(createReceiptFromUpload).toHaveBeenCalledWith("space-123", "file-123", {
        vendorName: "Test Vendor",
        documentDate: new Date("2025-12-13"),
        grossAmount: 100,
        currency: "EUR",
        category: "Office Supplies",
        vatRate: 0.19,
      });

      const result = await response.json();
      expect(result).toEqual(mockReceipt);
      expect(response.status).toBe(201);
    });

    it("should create a receipt with minimal required data", async () => {
      const mockSpace = { id: "space-123" };
      const mockReceipt = {
        id: "rec-123",
        vendorName: "Minimal Vendor",
        grossAmount: 50,
        status: "PENDING_REVIEW",
      };

      const requestBody = {
        fileId: "file-456",
        vendorName: "Minimal Vendor",
        documentDate: "2025-12-13",
        grossAmount: 50,
      };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (createReceiptFromUpload as any).mockResolvedValue(mockReceipt);

      const request = new Request("http://localhost/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(createReceiptFromUpload).toHaveBeenCalledWith("space-123", "file-456", {
        vendorName: "Minimal Vendor",
        documentDate: new Date("2025-12-13"),
        grossAmount: 50,
        currency: "EUR",
        vatRate: 0.19, // Default value
      });

      expect(response.status).toBe(201);
    });

    it("should handle validation errors", async () => {
      const mockSpace = { id: "space-123" };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });

      const invalidRequestBody = {
        // Missing required fields
        vendorName: "Test Vendor",
        grossAmount: 100,
      };

      const request = new Request("http://localhost/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain("Validation failed");
    });

    it("should handle service errors", async () => {
      const mockSpace = { id: "space-123" };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (createReceiptFromUpload as any).mockRejectedValue(new Error("File not found"));

      const requestBody = {
        fileId: "invalid-file",
        vendorName: "Test Vendor",
        documentDate: "2025-12-13",
        grossAmount: 100,
      };

      const request = new Request("http://localhost/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toBe("File not found");
    });
  });
});