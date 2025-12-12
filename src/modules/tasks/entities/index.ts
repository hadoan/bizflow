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

export interface CreateInboxItemInput {
  type?: InboxItemType;
  title: string;
  description?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface InboxItemFilters {
  status?: InboxItemStatus;
  type?: InboxItemType;
}
