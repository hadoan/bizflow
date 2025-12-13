import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/workspaces/route";

// Mock auth helpers
vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
  getUserSpaces: vi.fn(),
}));

// Mock workspace services
vi.mock("@/modules/workspaces/services", () => ({
  createWorkspace: vi.fn(),
}));

import { requireAuth, getUserSpaces } from "@/lib/auth";
import { createWorkspace } from "@/modules/workspaces/services";

describe("Workspaces API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/workspaces", () => {
    it("returns the user's workspaces", async () => {
      (requireAuth as any).mockResolvedValue({ id: "user-1" });
      (getUserSpaces as any).mockResolvedValue([
        { id: "space-1", name: "Demo", slug: "demo-personal" },
      ]);

      const response = await GET();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([{ id: "space-1", name: "Demo", slug: "demo-personal" }]);
      expect(getUserSpaces).toHaveBeenCalledWith("user-1");
    });

    it("returns 401 when unauthenticated", async () => {
      (requireAuth as any).mockRejectedValue(new Error("Unauthorized"));

      const response = await GET();
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/workspaces", () => {
    it("creates a workspace with checklist", async () => {
      const mockWorkspace = {
        id: "ws-1",
        name: "My Biz",
        slug: "my-biz",
        currency: "USD",
        timezone: "America/New_York",
        locale: "en-US",
        ownerUserId: "user-1",
      };

      const mockChecklist = [
        { id: "item-1", title: "Add your business identity" },
        { id: "item-2", title: "Create your first client" },
      ];

      (requireAuth as any).mockResolvedValue({ id: "user-1" });
      (createWorkspace as any).mockResolvedValue({
        workspace: mockWorkspace,
        gettingStarted: mockChecklist,
      });

      const request = new Request("http://localhost/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Biz",
          currency: "USD",
          timezone: "America/New_York",
          locale: "en-US",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(createWorkspace).toHaveBeenCalledWith({
        name: "My Biz",
        currency: "USD",
        timezone: "America/New_York",
        locale: "en-US",
        ownerUserId: "user-1",
      });
      expect(await response.json()).toEqual({
        workspace: mockWorkspace,
        gettingStarted: mockChecklist,
      });
    });

    it("rejects missing workspace name", async () => {
      (requireAuth as any).mockResolvedValue({ id: "user-1" });

      const request = new Request("http://localhost/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(createWorkspace).not.toHaveBeenCalled();
    });

    it("returns 401 when unauthenticated", async () => {
      (requireAuth as any).mockRejectedValue(new Error("Unauthorized"));

      const request = new Request("http://localhost/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Biz" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });
  });
});
