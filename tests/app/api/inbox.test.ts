import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/inbox/route";
import { db } from "@/lib/db";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    inboxItem: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock the auth
vi.mock("@/lib/auth", () => ({
  getCurrentUserWithSpace: vi.fn(),
}));

// Mock the tasks services
vi.mock("@/modules/tasks/services", () => ({
  getOpenInboxItems: vi.fn(),
  createInboxItem: vi.fn(),
}));

import { getCurrentUserWithSpace } from "@/lib/auth";
import { getOpenInboxItems, createInboxItem } from "@/modules/tasks/services";

describe("Inbox API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/inbox", () => {
    it("should return open inbox items for the current space", async () => {
      const mockSpace = { id: "space-123" };
      const mockItems = [
        {
          id: "item-1",
          spaceId: "space-123",
          type: "RECEIPT_REVIEW",
          title: "Review receipt",
          description: "New receipt uploaded",
          status: "OPEN",
          createdAt: "2025-12-13T10:00:00.000Z",
        },
        {
          id: "item-2",
          spaceId: "space-123",
          type: "GENERAL",
          title: "General task",
          description: "Something to do",
          status: "OPEN",
          createdAt: "2025-12-13T09:00:00.000Z",
        },
      ];

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (getOpenInboxItems as any).mockResolvedValue(mockItems);

      const request = new Request("http://localhost/api/inbox");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockItems);
      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(getOpenInboxItems).toHaveBeenCalledWith("space-123");
    });

    it("should handle authentication errors", async () => {
      (getCurrentUserWithSpace as any).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost/api/inbox");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle service errors", async () => {
      const mockSpace = { id: "space-123" };
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (getOpenInboxItems as any).mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost/api/inbox");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Database error");
    });
  });

  describe("POST /api/inbox", () => {
    it("should create an inbox item", async () => {
      const mockSpace = { id: "space-123" };
      const mockItem = {
        id: "item-1",
        spaceId: "space-123",
        type: "GENERAL",
        title: "Test Item",
        description: "Test description",
        status: "OPEN",
        createdAt: "2025-12-12T23:25:02.671Z",
        updatedAt: "2025-12-12T23:25:02.671Z",
      };

      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (createInboxItem as any).mockResolvedValue(mockItem);

      const request = new Request("http://localhost/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Item",
          description: "Test description",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockItem);
      expect(getCurrentUserWithSpace).toHaveBeenCalled();
      expect(createInboxItem).toHaveBeenCalledWith("space-123", {
        title: "Test Item",
        description: "Test description",
      });
    });

    it("should handle validation errors", async () => {
      const mockSpace = { id: "space-123" };
      (getCurrentUserWithSpace as any).mockResolvedValue({ space: mockSpace });
      (createInboxItem as any).mockRejectedValue(new Error("Title is required"));

      const request = new Request("http://localhost/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Title is required");
    });

    it("should handle authentication errors", async () => {
      (getCurrentUserWithSpace as any).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });
  });
});