import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  createTask,
  listOpenTasks,
  getTask,
  updateTask,
  completeTask,
  deleteTask,
} from "@/modules/tasks/services/tasks";
import { TaskStatus } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Task Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a task", async () => {
      const mockTask = {
        id: "task-1",
        spaceId: "space-1",
        title: "Test Task",
        description: "Test description",
        dueDate: new Date("2024-01-01"),
        status: TaskStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.task.create as any).mockResolvedValue(mockTask);

      const input = {
        title: "Test Task",
        description: "Test description",
        dueDate: new Date("2024-01-01"),
      };

      const result = await createTask("space-1", input);

      expect(db.task.create).toHaveBeenCalledWith({
        data: {
          spaceId: "space-1",
          title: "Test Task",
          description: "Test description",
          dueDate: new Date("2024-01-01"),
          status: TaskStatus.OPEN,
        },
      });

      expect(result).toEqual(mockTask);
    });
  });

  describe("listOpenTasks", () => {
    it("should list open tasks", async () => {
      const mockTasks = [
        {
          id: "task-1",
          spaceId: "space-1",
          title: "Open Task",
          status: TaskStatus.OPEN,
        },
      ];

      (db.task.findMany as any).mockResolvedValue(mockTasks);

      const result = await listOpenTasks("space-1");

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: {
          spaceId: "space-1",
          status: TaskStatus.OPEN,
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      });

      expect(result).toEqual(mockTasks);
    });
  });

  describe("getTask", () => {
    it("should get a specific task", async () => {
      const mockTask = {
        id: "task-1",
        spaceId: "space-1",
        title: "Test Task",
      };

      (db.task.findFirst as any).mockResolvedValue(mockTask);

      const result = await getTask("space-1", "task-1");

      expect(db.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: "task-1",
          spaceId: "space-1",
        },
      });

      expect(result).toEqual(mockTask);
    });

    it("should return null if task not found", async () => {
      (db.task.findFirst as any).mockResolvedValue(null);

      const result = await getTask("space-1", "task-1");

      expect(result).toBeNull();
    });
  });

  describe("updateTask", () => {
    it("should update a task", async () => {
      const mockTask = {
        id: "task-1",
        spaceId: "space-1",
        title: "Updated Task",
        description: "Updated description",
      };

      (db.task.update as any).mockResolvedValue(mockTask);

      const updates = {
        title: "Updated Task",
        description: "Updated description",
      };

      const result = await updateTask("space-1", "task-1", updates);

      expect(db.task.update).toHaveBeenCalledWith({
        where: {
          id: "task-1",
          spaceId: "space-1",
        },
        data: updates,
      });

      expect(result).toEqual(mockTask);
    });
  });

  describe("completeTask", () => {
    it("should complete a task", async () => {
      const mockTask = {
        id: "task-1",
        spaceId: "space-1",
        status: TaskStatus.DONE,
      };

      (db.task.update as any).mockResolvedValue(mockTask);

      const result = await completeTask("space-1", "task-1");

      expect(db.task.update).toHaveBeenCalledWith({
        where: {
          id: "task-1",
          spaceId: "space-1",
        },
        data: {
          status: TaskStatus.DONE,
        },
      });

      expect(result).toEqual(mockTask);
    });
  });

  describe("deleteTask", () => {
    it("should delete a task", async () => {
      (db.task.delete as any).mockResolvedValue(undefined);

      await deleteTask("space-1", "task-1");

      expect(db.task.delete).toHaveBeenCalledWith({
        where: {
          id: "task-1",
          spaceId: "space-1",
        },
      });
    });
  });
});