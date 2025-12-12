import { Task, TaskStatus, InboxItem, InboxItemType, InboxItemStatus } from "@prisma/client";

export type { Task, TaskStatus, InboxItem, InboxItemType, InboxItemStatus };

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
}

export interface TaskFilters {
  status?: TaskStatus;
  overdue?: boolean;
}

export interface InboxItemFilters {
  status?: InboxItemStatus;
  type?: InboxItemType;
}
