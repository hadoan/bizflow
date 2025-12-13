import { InboxItem, Space } from "@prisma/client";

export type Workspace = Space;
export type WorkspaceChecklistItem = InboxItem;

export interface CreateWorkspaceInput {
  name: string;
  currency?: string;
  timezone?: string;
  locale?: string;
  ownerUserId: string;
}

export interface WorkspaceWithChecklist {
  workspace: Workspace;
  gettingStarted: WorkspaceChecklistItem[];
}
