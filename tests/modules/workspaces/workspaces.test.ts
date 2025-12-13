import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembershipRole } from "@prisma/client";

const mockDb = vi.hoisted(() => ({
  space: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  spaceMembership: {
    create: vi.fn(),
  },
  inboxItem: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import { createWorkspace } from "@/modules/workspaces/services";

describe("workspace services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.$transaction.mockImplementation(async (cb: any) => cb(mockDb));
  });

  it("creates a workspace with a unique slug and onboarding checklist", async () => {
    mockDb.space.findUnique
      .mockResolvedValueOnce({ id: "existing-space" })
      .mockResolvedValueOnce(null);

    const createdAt = new Date();
    const space = {
      id: "space-1",
      name: "My Workspace",
      slug: "my-workspace-1",
      ownerUserId: "user-1",
      currency: "USD",
      timezone: "America/New_York",
      locale: "en-US",
      spaceType: "PERSONAL",
      country: "US",
      createdAt,
      updatedAt: createdAt,
    };

    mockDb.space.create.mockResolvedValue(space);

    let inboxCounter = 0;
    mockDb.inboxItem.create.mockImplementation(({ data }: any) => {
      inboxCounter += 1;
      return Promise.resolve({
        id: `inbox-${inboxCounter}`,
        ...data,
        createdAt,
        updatedAt: createdAt,
      });
    });

    const result = await createWorkspace({
      name: "My Workspace",
      currency: "USD",
      timezone: "America/New_York",
      locale: "en-US",
      ownerUserId: "user-1",
    });

    expect(result.workspace.slug).toBe("my-workspace-1");
    expect(mockDb.space.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "My Workspace",
        slug: "my-workspace-1",
        currency: "USD",
        timezone: "America/New_York",
        locale: "en-US",
        ownerUserId: "user-1",
      }),
    });
    expect(mockDb.spaceMembership.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        spaceId: "space-1",
        role: MembershipRole.OWNER,
      },
    });
    expect(result.gettingStarted).toHaveLength(4);
    expect(result.gettingStarted[0].metadata.checklist).toBe("getting-started");
  });

  it("throws when workspace name missing", async () => {
    await expect(
      createWorkspace({
        name: "",
        ownerUserId: "user-1",
      })
    ).rejects.toThrow("Workspace name is required");
  });
});
