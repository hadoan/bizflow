import { db } from "@/lib/db";
import type { InboxItemFilters, InboxItem } from "../entities";
import { InboxItemStatus } from "@prisma/client";

export async function listInboxItems(
  spaceId: string,
  filters?: InboxItemFilters
): Promise<InboxItem[]> {
  const where: any = { spaceId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  return await db.inboxItem.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOpenInboxItems(spaceId: string): Promise<InboxItem[]> {
  return listInboxItems(spaceId, { status: InboxItemStatus.OPEN });
}

export async function getInboxItem(spaceId: string, itemId: string): Promise<InboxItem | null> {
  return await db.inboxItem.findFirst({
    where: {
      id: itemId,
      spaceId,
    },
  });
}

export async function resolveInboxItem(spaceId: string, itemId: string): Promise<InboxItem> {
  return await db.inboxItem.update({
    where: {
      id: itemId,
      spaceId,
    },
    data: {
      status: InboxItemStatus.RESOLVED,
    },
  });
}

export async function dismissInboxItem(spaceId: string, itemId: string): Promise<InboxItem> {
  return await db.inboxItem.update({
    where: {
      id: itemId,
      spaceId,
    },
    data: {
      status: InboxItemStatus.DISMISSED,
    },
  });
}

export async function deleteInboxItem(spaceId: string, itemId: string): Promise<void> {
  await db.inboxItem.delete({
    where: {
      id: itemId,
      spaceId,
    },
  });
}
