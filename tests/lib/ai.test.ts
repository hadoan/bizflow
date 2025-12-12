import { describe, it, expect, vi, beforeEach } from "vitest";
import { callLLM } from "@/lib/ai";

describe("AI Client", () => {
  describe("callLLM", () => {
    it("should return a string response for user prompt only", async () => {
      const result = await callLLM("Hello, how are you?");

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return a string response with system message", async () => {
      const result = await callLLM("Tell me a joke", {
        system: "You are a comedian",
      });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle empty prompt", async () => {
      const result = await callLLM("");

      expect(typeof result).toBe("string");
    });

    it("should handle prompt with special characters", async () => {
      const result = await callLLM("Hello! How are you? @#$%^&*()");

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});