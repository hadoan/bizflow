import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/expenses/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUserWithSpace: vi.fn(),
}));

// Mock services
vi.mock("@/modules/finance/services", () => ({
  listExpenses: vi.fn(),
  createExpense: vi.fn(),
}));

import { getCurrentUserWithSpace } from "@/lib/auth";
import { listExpenses, createExpense } from "@/modules/finance/services";

describe("Expenses API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/expenses", () => {
    it("returns expenses with filters", async () => {
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: { id: "space-1" } });
      (listExpenses as any).mockResolvedValue([{ id: "exp-1", vendor: "AWS" }]);

      const response = await GET(
        new Request("http://localhost/api/expenses?category=cloud&project=proj-1&from=2025-01-01&to=2025-01-31")
      );

      expect(response.status).toBe(200);
      expect(listExpenses).toHaveBeenCalledWith("space-1", {
        category: "cloud",
        projectLink: "proj-1",
        fromDate: new Date("2025-01-01"),
        toDate: new Date("2025-01-31"),
      });
      expect(await response.json()).toEqual([{ id: "exp-1", vendor: "AWS" }]);
    });

    it("handles auth error", async () => {
      (getCurrentUserWithSpace as any).mockRejectedValue(new Error("Unauthorized"));
      const response = await GET(new Request("http://localhost/api/expenses"));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/expenses", () => {
    it("creates expense with valid data", async () => {
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: { id: "space-1" } });
      (createExpense as any).mockResolvedValue({ id: "exp-1", vendor: "AWS" });

      const body = {
        vendor: "AWS",
        category: "Cloud",
        amount: 100,
        currency: "USD",
        date: "2025-01-01",
        taxAmount: 0,
        projectLink: "proj-1",
        billable: true,
        notes: "Monthly bill",
        fxRate: 0.9,
      };

      const response = await POST(
        new Request("http://localhost/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

      expect(response.status).toBe(201);
      expect(createExpense).toHaveBeenCalledWith("space-1", {
        vendor: "AWS",
        category: "Cloud",
        amount: 100,
        currency: "USD",
        date: new Date("2025-01-01"),
        taxAmount: 0,
        projectLink: "proj-1",
        billable: true,
        notes: "Monthly bill",
        fxRate: 0.9,
      });
    });

    it("returns 400 on missing required fields", async () => {
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: { id: "space-1" } });

      const response = await POST(
        new Request("http://localhost/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor: "AWS" }),
        })
      );

      expect(response.status).toBe(400);
    });

    it("handles service errors", async () => {
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: { id: "space-1" } });
      (createExpense as any).mockRejectedValue(new Error("Failed"));

      const body = {
        vendor: "AWS",
        category: "Cloud",
        amount: 100,
        date: "2025-01-01",
      };

      const response = await POST(
        new Request("http://localhost/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

      expect(response.status).toBe(500);
    });
  });
});
