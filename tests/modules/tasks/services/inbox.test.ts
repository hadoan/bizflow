import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  createInboxItem,
  listInboxItems,
  getInboxItem,
  resolveInboxItem,
  dismissInboxItem,
  deleteInboxItem,
} from "@/modules/tasks/services/inbox";
import { InboxItemStatus, InboxItemType } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    inboxItem: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Inbox Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createInboxItem", () => {
    it("should create an inbox item", async () => {
      const mockItem = {
        id: "item-1",
        spaceId: "space-1",
        type: InboxItemType.GENERAL,
        title: "Test Item",
        description: "Test description",
        relatedEntityType: "invoice",
        relatedEntityId: "inv-1",
        status: InboxItemStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.inboxItem.create as any).mockResolvedValue(mockItem);

      const input = {
        type: InboxItemType.GENERAL,
        title: "Test Item",
        description: "Test description",
        relatedEntityType: "invoice",
        relatedEntityId: "inv-1",
      };

      const result = await createInboxItem("space-1", input);

      expect(db.inboxItem.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          type: InboxItemType.GENERAL,
          title: "Test Item",
          description: "Test description",
          relatedEntityType: "invoice",
          relatedEntityId: "inv-1",
          status: InboxItemStatus.OPEN,
        },
      });

      expect(result).toEqual(mockItem);
    });

    it("should use default type when not provided", async () => {
      const mockItem = {
        id: "item-1",
        spaceId: "space-1",
        type: InboxItemType.GENERAL,
        title: "Test Item",
        status: InboxItemStatus.OPEN,
      };

      (db.inboxItem.create as any).mockResolvedValue(mockItem);

      const input = {
        title: "Test Item",
      };

      const result = await createInboxItem("space-1", input);

      expect(db.inboxItem.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          type: InboxItemType.GENERAL,
          title: "Test Item",
          status: InboxItemStatus.OPEN,
        },
      });

      expect(result).toEqual(mockItem);
    });
  });

  describe("listInboxItems", () => {
    it("should list inbox items with filters", async () => {
      const mockItems = [
        {
          id: "item-1",
          spaceId: "space-1",
          type: InboxItemType.RECEIPT_REVIEW,
          status: InboxItemStatus.OPEN,
        },
      ];

      (db.inboxItem.findMany as any).mockResolvedValue(mockItems);

      const filters = {
        status: InboxItemStatus.OPEN,
        type: InboxItemType.RECEIPT_REVIEW,
      };

      const result = await listInboxItems("space-1", filters);

      expect(db.inboxItem.findMany).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          status: InboxItemStatus.OPEN,
          type: InboxItemType.RECEIPT_REVIEW,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual(mockItems);
    });
  });

  describe("getInboxItem", () => {
    it("should get a specific inbox item", async () => {
      const mockItem = {
        id: "item-1",
        spaceId: "space-1",
        title: "Test Item",
      };

      (db.inboxItem.findFirst as any).mockResolvedValue(mockItem);

      const result = await getInboxItem("space-1", "item-1");

      expect(db.inboxItem.findFirst).toHaveBeenCalledWith({
        where: {
          id: "item-1",
          spaceId: "space-1",
        },
      });

      expect(result).toEqual(mockItem);
    });

    it("should return null if item not found", async () => {
      (db.inboxItem.findFirst as any).mockResolvedValue(null);

      const result = await getInboxItem("space-1", "item-1");

      expect(result).toBeNull();
    });
  });

  describe("resolveInboxItem", () => {
    it("should resolve an inbox item", async () => {
      const mockItem = {
        id: "item-1",
        spaceId: "space-1",
        status: InboxItemStatus.RESOLVED,
      };

      (db.inboxItem.update as any).mockResolvedValue(mockItem);

      const result = await resolveInboxItem("space-1", "item-1");

      expect(db.inboxItem.update).toHaveBeenCalledWith({
        where: {
          id: "item-1",
          spaceId: "space-1",
        },
        data: {
          status: InboxItemStatus.RESOLVED,
        },
      });

      expect(result).toEqual(mockItem);
    });
  });

  describe("dismissInboxItem", () => {
    it("should dismiss an inbox item", async () => {
      const mockItem = {
        id: "item-1",
        spaceId: "space-1",
        status: InboxItemStatus.DISMISSED,
      };

      (db.inboxItem.update as any).mockResolvedValue(mockItem);

      const result = await dismissInboxItem("space-1", "item-1");

      expect(db.inboxItem.update).toHaveBeenCalledWith({
        where: {
          id: "item-1",
          spaceId: "space-1",
        },
        data: {
          status: InboxItemStatus.DISMISSED,
        },
      });

      expect(result).toEqual(mockItem);
    });
  });

  describe("deleteInboxItem", () => {
    it("should delete an inbox item", async () => {
      (db.inboxItem.delete as any).mockResolvedValue(undefined);

      await deleteInboxItem("space-1", "item-1");

      expect(db.inboxItem.delete).toHaveBeenCalledWith({
        where: {
          id: "item-1",
          spaceId: "space-1",
        },
      });
    });
  });
});