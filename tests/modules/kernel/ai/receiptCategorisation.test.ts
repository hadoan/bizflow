import { describe, it, expect, vi } from "vitest";
import { suggestReceiptCategorisation } from "@/modules/kernel/ai/receiptCategorisation";

// Mock the callLLM function
vi.mock("@/lib/ai", () => ({
  callLLM: vi.fn(),
}));

import { callLLM } from "@/lib/ai";

describe("Receipt Categorisation AI", () => {
  describe("suggestReceiptCategorisation", () => {
    it("should categorize transport receipts using rule-based matching", async () => {
      const result = await suggestReceiptCategorisation({
        text: "Train ticket from Berlin to Munich",
        amount: 45.50,
        vendor: "Deutsche Bahn",
      });

      expect(result).toEqual({
        category: "Transport",
        vatRate: 0.19,
        explanation: 'Matched keyword "bahn" in vendor or text',
      });
    });

    it("should categorize cloud services using rule-based matching", async () => {
      const result = await suggestReceiptCategorisation({
        text: "AWS hosting fees",
        amount: 125.00,
        vendor: "Amazon Web Services",
      });

      expect(result).toEqual({
        category: "Cloud services",
        vatRate: 0.19,
        explanation: 'Matched keyword "aws" in vendor or text',
      });
    });

    it("should categorize meals using rule-based matching", async () => {
      const result = await suggestReceiptCategorisation({
        text: "Business lunch with client",
        amount: 67.80,
        vendor: "Restaurant Berlin",
      });

      expect(result).toEqual({
        category: "Meals & entertainment",
        vatRate: 0.19,
        explanation: 'Matched keyword "restaurant" in vendor or text',
      });
    });

    it("should use AI categorization when no rules match", async () => {
      const mockAIResponse = `{"category": "Professional services", "vatRate": 0.19, "explanation": "Consulting services for software development"}`;

      (callLLM as any).mockResolvedValue(mockAIResponse);

      const result = await suggestReceiptCategorisation({
        text: "Software consulting services",
        amount: 500.00,
        vendor: "Tech Solutions GmbH",
      });

      expect(callLLM).toHaveBeenCalledWith(
        expect.stringContaining("Software consulting services"),
        expect.any(Object)
      );

      expect(result).toEqual({
        category: "Professional services",
        vatRate: 0.19,
        explanation: "Consulting services for software development",
      });
    });

    it("should handle AI response with embedded JSON", async () => {
      const mockAIResponse = `Based on the receipt details, I categorize this as: {"category": "Office supplies", "vatRate": 0.19, "explanation": "Office equipment purchase"}`;

      (callLLM as any).mockResolvedValue(mockAIResponse);

      const result = await suggestReceiptCategorisation({
        text: "Office chair and desk",
        amount: 299.99,
        vendor: "Office Depot",
      });

      expect(result).toEqual({
        category: "Office supplies",
        vatRate: 0.19,
        explanation: "Office equipment purchase",
      });
    });

    it("should use history context in AI prompt", async () => {
      const mockAIResponse = `{"category": "Software subscriptions", "vatRate": 0.19, "explanation": "Similar to previous Adobe purchases"}`;

      (callLLM as any).mockResolvedValue(mockAIResponse);

      const result = await suggestReceiptCategorisation({
        text: "Software license for design tools",
        amount: 59.99,
        vendor: "Creative Software Ltd", // Vendor that doesn't match any rules
        history: [
          { category: "Software subscriptions", vendor: "Adobe Inc", amount: 59.99 },
          { category: "Office supplies", vendor: "Staples", amount: 25.50 },
        ],
      });

      expect(callLLM).toHaveBeenCalledWith(
        expect.stringContaining("Previous similar receipts"),
        expect.any(Object)
      );

      expect(result).toEqual({
        category: "Software subscriptions",
        vatRate: 0.19,
        explanation: "Similar to previous Adobe purchases",
      });
    });

    it("should handle AI errors gracefully with fallback", async () => {
      (callLLM as any).mockRejectedValue(new Error("AI service unavailable"));

      const result = await suggestReceiptCategorisation({
        text: "Unknown service",
        amount: 100.00,
        vendor: "Unknown Vendor",
      });

      expect(result).toEqual({
        category: "Other",
        vatRate: 0.19,
        explanation: "Fallback categorization (AI unavailable)",
      });
    });

    it("should handle malformed AI JSON response", async () => {
      (callLLM as any).mockResolvedValue("This is not JSON at all");

      const result = await suggestReceiptCategorisation({
        text: "Some receipt",
        amount: 50.00,
        vendor: "Some Vendor",
      });

      expect(result).toEqual({
        category: "Other",
        vatRate: 0.19,
        explanation: "Could not parse AI response, using default categorization",
      });
    });

    it("should handle empty history array", async () => {
      const mockAIResponse = `{"category": "Marketing & advertising", "vatRate": 0.19, "explanation": "Social media advertising campaign"}`;

      (callLLM as any).mockResolvedValue(mockAIResponse);

      const result = await suggestReceiptCategorisation({
        text: "Facebook ads campaign",
        amount: 150.00,
        vendor: "Meta Platforms",
        history: [],
      });

      expect(result).toEqual({
        category: "Marketing & advertising",
        vatRate: 0.19,
        explanation: "Social media advertising campaign",
      });
    });
  });
});