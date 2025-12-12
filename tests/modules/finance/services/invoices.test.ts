import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { emitEvent } from "@/modules/kernel/workflows";
import {
  createInvoice,
  listInvoices,
  getInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoiceNumber,
} from "@/modules/finance/services/invoices";
import { InvoiceStatus } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    invoice: {
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

describe("Invoice Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createInvoice", () => {
    it("should create an invoice with line items", async () => {
      const mockInvoice = {
        id: "inv-1",
        spaceId: "space-1",
        clientId: "client-1",
        number: "2024-001",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-01-31"),
        currency: "EUR",
        netAmount: 100,
        vatAmount: 19,
        grossAmount: 119,
        status: InvoiceStatus.DRAFT,
        lineItems: [
          {
            id: "line-1",
            description: "Service",
            quantity: 1,
            unitPrice: 100,
            vatRate: 0.19,
            netAmount: 100,
            vatAmount: 19,
            grossAmount: 119,
          },
        ],
      };

      (db.invoice.create as any).mockResolvedValue(mockInvoice);

      const input = {
        clientId: "client-1",
        number: "2024-001",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-01-31"),
        currency: "EUR",
        lineItems: [
          {
            description: "Service",
            quantity: 1,
            unitPrice: 100,
            vatRate: 0.19,
          },
        ],
      };

      const result = await createInvoice("space-1", input);

      expect(db.invoice.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          clientId: "client-1",
          number: "2024-001",
          issueDate: new Date("2024-01-01"),
          dueDate: new Date("2024-01-31"),
          currency: "EUR",
          netAmount: 100,
          vatAmount: 19,
          grossAmount: 119,
          status: InvoiceStatus.DRAFT,
          lineItems: {
            create: [
              {
                description: "Service",
                quantity: 1,
                unitPrice: 100,
                vatRate: 0.19,
                netAmount: 100,
                vatAmount: 19,
                grossAmount: 119,
              },
            ],
          },
        },
        include: {
          lineItems: true,
        },
      });

      expect(emitEvent).toHaveBeenCalledWith("invoice.created", "space-1", {
        invoiceId: "inv-1",
      });

      expect(result).toEqual(mockInvoice);
    });
  });

  describe("listInvoices", () => {
    it("should list invoices with filters", async () => {
      const mockInvoices = [
        {
          id: "inv-1",
          spaceId: "space-1",
          status: InvoiceStatus.DRAFT,
          lineItems: [],
          client: { id: "client-1", name: "Client 1" },
        },
      ];

      (db.invoice.findMany as any).mockResolvedValue(mockInvoices);

      const filters = {
        status: InvoiceStatus.DRAFT,
        fromDate: new Date("2024-01-01"),
      };

      const result = await listInvoices("space-1", filters);

      expect(db.invoice.findMany).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          status: InvoiceStatus.DRAFT,
          issueDate: { gte: new Date("2024-01-01") },
        },
        include: {
          lineItems: true,
          client: true,
        },
        orderBy: {
          issueDate: "desc",
        },
      });

      expect(result).toEqual(mockInvoices);
    });
  });

  describe("getInvoice", () => {
    it("should get a specific invoice", async () => {
      const mockInvoice = {
        id: "inv-1",
        spaceId: "space-1",
        lineItems: [],
        client: { id: "client-1", name: "Client 1" },
      };

      (db.invoice.findFirst as any).mockResolvedValue(mockInvoice);

      const result = await getInvoice("space-1", "inv-1");

      expect(db.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          id: "inv-1",
          spaceId: "space-1",
        },
        include: {
          lineItems: true,
          client: true,
        },
      });

      expect(result).toEqual(mockInvoice);
    });
  });

  describe("updateInvoiceStatus", () => {
    it("should update invoice status and emit event", async () => {
      const mockInvoice = {
        id: "inv-1",
        spaceId: "space-1",
        status: InvoiceStatus.SENT,
        lineItems: [],
      };

      (db.invoice.update as any).mockResolvedValue(mockInvoice);

      const result = await updateInvoiceStatus("space-1", "inv-1", InvoiceStatus.SENT);

      expect(db.invoice.update).toHaveBeenCalledWith({
        where: {
          id: "inv-1",
          spaceId: "space-1",
        },
        data: {
          status: InvoiceStatus.SENT,
        },
        include: {
          lineItems: true,
        },
      });

      expect(emitEvent).toHaveBeenCalledWith("invoice.sent", "space-1", {
        invoiceId: "inv-1",
      });

      expect(result).toEqual(mockInvoice);
    });
  });

  describe("deleteInvoice", () => {
    it("should delete an invoice", async () => {
      (db.invoice.delete as any).mockResolvedValue(undefined);

      await deleteInvoice("space-1", "inv-1");

      expect(db.invoice.delete).toHaveBeenCalledWith({
        where: {
          id: "inv-1",
          spaceId: "space-1",
        },
      });
    });
  });

  describe("generateInvoiceNumber", () => {
    it("should generate first invoice number for year", async () => {
      (db.invoice.findFirst as any).mockResolvedValue(null);

      const result = await generateInvoiceNumber("space-1", 2024);

      expect(db.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          number: {
            startsWith: "2024",
          },
        },
        orderBy: {
          number: "desc",
        },
      });

      expect(result).toBe("2024-001");
    });

    it("should generate next invoice number", async () => {
      const mockLastInvoice = {
        number: "2024-005",
      };

      (db.invoice.findFirst as any).mockResolvedValue(mockLastInvoice);

      const result = await generateInvoiceNumber("space-1", 2024);

      expect(result).toBe("2024-006");
    });
  });
});