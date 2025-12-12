import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/tax/overview/route";
import { db } from "@/lib/db";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    invoice: {
      findMany: vi.fn(),
    },
    receipt: {
      findMany: vi.fn(),
    },
  },
}));

// Mock the auth
vi.mock("@/lib/auth", () => ({
  getCurrentUserWithSpace: vi.fn(),
}));

// Mock the finance services
vi.mock("@/modules/finance/services", () => ({
  getTaxOverview: vi.fn(),
}));

import { getCurrentUserWithSpace } from "@/lib/auth";
import { getTaxOverview } from "@/modules/finance/services";

describe("Tax Overview API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tax/overview", () => {
    it("should return tax overview with query parameters", async () => {
      const mockSpace = { id: "space-123" };
      const mockOverview = {
        period: { year: 2025, type: "MONTH", value: 12 },
        income: 5000,
        expenses: 2000,
        vatCollected: 950,
        vatPaid: 380,
        vatDue: 570,
        netProfit: 3000,
      };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (getTaxOverview as any).mockResolvedValue(mockOverview);

      const request = new Request("http://localhost/api/tax/overview?year=2025&periodType=MONTH&periodValue=12");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockOverview);
      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(getTaxOverview).toHaveBeenCalledWith("space-123", 2025, "MONTH", 12);
    });

    it("should handle validation errors for missing parameters", async () => {
      const mockSpace = { id: "space-123" };
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });

      const request = new Request("http://localhost/api/tax/overview?year=2025");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain("Expected");
    });

    it("should handle authentication errors", async () => {
      (getCurrentUserWithSpace as any).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost/api/tax/overview?year=2025&periodType=MONTH&periodValue=12");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle service errors", async () => {
      const mockSpace = { id: "space-123" };
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (getTaxOverview as any).mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost/api/tax/overview?year=2025&periodType=MONTH&periodValue=12");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Database error");
    });
  });

  describe("POST /api/tax/overview", () => {
    it("should return tax overview with JSON body", async () => {
      const mockSpace = { id: "space-123" };
      const mockOverview = {
        period: { year: 2025, type: "QUARTER", value: 4 },
        income: 15000,
        expenses: 8000,
        vatCollected: 2850,
        vatPaid: 1520,
        vatDue: 1330,
        netProfit: 7000,
      };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (getTaxOverview as any).mockResolvedValue(mockOverview);

      const request = new Request("http://localhost/api/tax/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: 2025,
          periodType: "QUARTER",
          periodValue: 4,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockOverview);
      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(getTaxOverview).toHaveBeenCalledWith("space-123", 2025, "QUARTER", 4);
    });

    it("should handle validation errors for invalid body", async () => {
      const mockSpace = { id: "space-123" };
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });

      const request = new Request("http://localhost/api/tax/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: "invalid",
          periodType: "MONTH",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain("invalid_type");
    });

    it("should handle authentication errors", async () => {
      (getCurrentUserWithSpace as any).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost/api/tax/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: 2025,
          periodType: "YEAR",
          periodValue: 1,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });
  });
});