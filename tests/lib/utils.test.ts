import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, calculateVAT, calculateGross, slugify } from "@/lib/utils";

describe("Utils", () => {
  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      expect(formatCurrency(1000)).toBe("1.000,00\u00A0€");
      expect(formatCurrency(1234.56)).toBe("1.234,56\u00A0€");
    });
  });

  describe("calculateVAT", () => {
    it("should calculate VAT correctly", () => {
      expect(calculateVAT(100, 0.19)).toBe(19);
      expect(calculateVAT(100, 0.07)).toBeCloseTo(7);
    });
  });

  describe("calculateGross", () => {
    it("should calculate gross amount correctly", () => {
      expect(calculateGross(100, 0.19)).toBe(119);
      expect(calculateGross(100, 0.07)).toBe(107);
    });
  });

  describe("slugify", () => {
    it("should create valid slugs", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("Test  Multiple   Spaces")).toBe("test-multiple-spaces");
      expect(slugify("Special@#$Characters!")).toBe("specialcharacters");
    });
  });
});
