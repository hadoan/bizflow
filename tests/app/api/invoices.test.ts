import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/invoices/route";
import { db } from "@/lib/db";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    invoice: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock the auth
vi.mock("@/lib/auth", () => ({
  getCurrentUserWithSpace: vi.fn(),
}));

// Mock the finance services
vi.mock("@/modules/finance/services", () => ({
  listInvoices: vi.fn(),
  createInvoice: vi.fn(),
}));

import { getCurrentUserWithSpace } from "@/lib/auth";
import { listInvoices, createInvoice } from "@/modules/finance/services";

describe("Invoices API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/invoices", () => {
    it("should return invoices with filters", async () => {
      const mockSpace = { id: "space-123" };
      const mockInvoices = [
        { id: "inv-1", number: "2025-001", status: "PAID" },
        { id: "inv-2", number: "2025-002", status: "DRAFT" },
      ];

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (listInvoices as any).mockResolvedValue(mockInvoices);

      const request = new Request("http://localhost/api/invoices?status=DRAFT&period=2025-12");
      const response = await GET(request);

      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(listInvoices).toHaveBeenCalledWith("space-123", {
        status: "DRAFT",
        fromDate: new Date(2025, 11, 1), // December 2025
        toDate: new Date(2025, 11, 31),
      });

      const result = await response.json();
      expect(result).toEqual(mockInvoices);
      expect(response.status).toBe(200);
    });

    it("should handle year-only period filter", async () => {
      const mockSpace = { id: "space-123" };
      const mockInvoices = [{ id: "inv-1", number: "2025-001" }];

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (listInvoices as any).mockResolvedValue(mockInvoices);

      const request = new Request("http://localhost/api/invoices?period=2025");
      const response = await GET(request);

      expect(listInvoices).toHaveBeenCalledWith("space-123", {
        fromDate: new Date(2025, 0, 1), // January 2025
        toDate: new Date(2025, 11, 31), // December 2025
      });

      expect(response.status).toBe(200);
    });

    it("should handle authentication errors", async () => {
      (getCurrentUserWithSpace as any).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost/api/invoices");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/invoices", () => {
    it("should create an invoice with valid data", async () => {
      const mockSpace = { id: "space-123" };
      const mockInvoice = {
        id: "inv-123",
        number: "2025-005",
        status: "DRAFT",
      };

      const requestBody = {
        clientId: "client-123",
        number: "2025-005",
        issueDate: "2025-12-13",
        dueDate: "2025-12-27",
        lineItems: [
          {
            description: "Web development services",
            quantity: 10,
            unitPrice: 100,
            vatRate: 0.19,
          },
        ],
      };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (createInvoice as any).mockResolvedValue(mockInvoice);

      const request = new Request("http://localhost/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(createInvoice).toHaveBeenCalledWith("space-123", {
        clientId: "client-123",
        number: "2025-005",
        issueDate: new Date("2025-12-13"),
        dueDate: new Date("2025-12-27"),
        currency: "EUR",
        lineItems: [
          {
            description: "Web development services",
            quantity: 10,
            unitPrice: 100,
            vatRate: 0.19,
          },
        ],
      });

      const result = await response.json();
      expect(result).toEqual(mockInvoice);
      expect(response.status).toBe(201);
    });

    it("should handle validation errors", async () => {
      const mockSpace = { id: "space-123" };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });

      const invalidRequestBody = {
        // Missing required fields
        clientId: "client-123",
      };

      const request = new Request("http://localhost/api/invoices", {
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
      (createInvoice as any).mockRejectedValue(new Error("Client not found"));

      const requestBody = {
        clientId: "invalid-client",
        number: "2025-005",
        issueDate: "2025-12-13",
        dueDate: "2025-12-27",
        lineItems: [
          {
            description: "Web development services",
            quantity: 10,
            unitPrice: 100,
            vatRate: 0.19,
          },
        ],
      };

      const request = new Request("http://localhost/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toBe("Client not found");
    });
  });
});