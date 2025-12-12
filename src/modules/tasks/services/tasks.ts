import { db } from "@/lib/db";
import type { CreateTaskInput, TaskFilters, Task } from "../entities";
import { TaskStatus } from "@prisma/client";

export async function createTask(spaceId: string, input: CreateTaskInput): Promise<Task> {
  return await db.task.create({
    data: {
      spaceId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      status: TaskStatus.OPEN,
    },
  });
}

export async function listTasks(spaceId: string, filters?: TaskFilters): Promise<Task[]> {
  const where: any = { spaceId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.overdue) {
    where.dueDate = {
      lt: new Date(),
    };
    where.status = TaskStatus.OPEN;
  }

  return await db.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function listOpenTasks(spaceId: string): Promise<Task[]> {
  return listTasks(spaceId, { status: TaskStatus.OPEN });
}

export async function getTask(spaceId: string, taskId: string): Promise<Task | null> {
  return await db.task.findFirst({
    where: {
      id: taskId,
      spaceId,
    },
  });
}

export async function updateTask(
  spaceId: string,
  taskId: string,
  updates: Partial<CreateTaskInput>
): Promise<Task> {
  return await db.task.update({
    where: {
      id: taskId,
      spaceId,
    },
    data: updates,
  });
}

export async function completeTask(spaceId: string, taskId: string): Promise<Task> {
  return await db.task.update({
    where: {
      id: taskId,
      spaceId,
    },
    data: {
      status: TaskStatus.DONE,
    },
  });
}

export async function deleteTask(spaceId: string, taskId: string): Promise<void> {
  await db.task.delete({
    where: {
      id: taskId,
      spaceId,
    },
  });
}
