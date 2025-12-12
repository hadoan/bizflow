import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  createClient,
  listClients,
  getClient,
  updateClient,
  deleteClient,
} from "@/modules/crm/services/clients";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    client: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Client Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createClient", () => {
    it("should create a client", async () => {
      const mockClient = {
        id: "client-1",
        spaceId: "space-1",
        name: "Test Client",
        email: "test@example.com",
        vatId: "DE123456789",
        address: "Test Address",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.client.create as any).mockResolvedValue(mockClient);

      const input = {
        name: "Test Client",
        email: "test@example.com",
        vatId: "DE123456789",
        address: "Test Address",
      };

      const result = await createClient("space-1", input);

      expect(db.client.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          name: "Test Client",
          email: "test@example.com",
          vatId: "DE123456789",
          address: "Test Address",
        },
      });

      expect(result).toEqual(mockClient);
    });
  });

  describe("listClients", () => {
    it("should list clients without filters", async () => {
      const mockClients = [
        {
          id: "client-1",
          spaceId: "space-1",
          name: "Client A",
          email: "a@example.com",
        },
        {
          id: "client-2",
          spaceId: "space-1",
          name: "Client B",
          email: "b@example.com",
        },
      ];

      (db.client.findMany as any).mockResolvedValue(mockClients);

      const result = await listClients("space-1");

      expect(db.client.findMany).toHaveBeenCalledWith({
        where: { spaceId: "space-1" },
        orderBy: { name: "asc" },
      });

      expect(result).toEqual(mockClients);
    });

    it("should list clients with search filter", async () => {
      const mockClients = [
        {
          id: "client-1",
          spaceId: "space-1",
          name: "Test Client",
          email: "test@example.com",
        },
      ];

      (db.client.findMany as any).mockResolvedValue(mockClients);

      const filters = { search: "test" };
      const result = await listClients("space-1", filters);

      expect(db.client.findMany).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          OR: [
            { name: { contains: "test", mode: "insensitive" } },
            { email: { contains: "test", mode: "insensitive" } },
          ],
        },
        orderBy: { name: "asc" },
      });

      expect(result).toEqual(mockClients);
    });
  });

  describe("getClient", () => {
    it("should get a specific client", async () => {
      const mockClient = {
        id: "client-1",
        spaceId: "space-1",
        name: "Test Client",
        email: "test@example.com",
      };

      (db.client.findFirst as any).mockResolvedValue(mockClient);

      const result = await getClient("space-1", "client-1");

      expect(db.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: "client-1",
          spaceId: "space-1",
        },
      });

      expect(result).toEqual(mockClient);
    });

    it("should return null if client not found", async () => {
      (db.client.findFirst as any).mockResolvedValue(null);

      const result = await getClient("space-1", "client-1");

      expect(result).toBeNull();
    });
  });

  describe("updateClient", () => {
    it("should update a client", async () => {
      const mockClient = {
        id: "client-1",
        spaceId: "space-1",
        name: "Updated Client",
        email: "updated@example.com",
      };

      (db.client.update as any).mockResolvedValue(mockClient);

      const updates = {
        name: "Updated Client",
        email: "updated@example.com",
      };

      const result = await updateClient("space-1", "client-1", updates);

      expect(db.client.update).toHaveBeenCalledWith({
        where: {
          id: "client-1",
          spaceId: "space-1",
        },
        data: updates,
      });

      expect(result).toEqual(mockClient);
    });
  });

  describe("deleteClient", () => {
    it("should delete a client", async () => {
      (db.client.delete as any).mockResolvedValue(undefined);

      await deleteClient("space-1", "client-1");

      expect(db.client.delete).toHaveBeenCalledWith({
        where: {
          id: "client-1",
          spaceId: "space-1",
        },
      });
    });
  });
});