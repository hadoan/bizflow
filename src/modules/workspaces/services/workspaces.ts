import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { CreateWorkspaceInput, WorkspaceWithChecklist } from "../entities";
import { InboxItemStatus, InboxItemType, MembershipRole, SpaceType } from "@prisma/client";

interface ChecklistTemplateItem {
  title: string;
  description?: string;
  type?: InboxItemType;
}

const GETTING_STARTED_CHECKLIST: ChecklistTemplateItem[] = [
  {
    title: "Add your business identity",
    description: "Set your legal name, logo, and payment details before sending invoices.",
  },
  {
    title: "Create your first client",
    description: "Add a client profile so you can start invoicing right away.",
  },
  {
    title: "Send your first invoice",
    description: "Use your workspace currency and numbering to issue an invoice.",
  },
  {
    title: "Upload a receipt",
    description: "Track an expense to keep your books in sync.",
  },
];

async function generateUniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base || "workspace") || "workspace";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.space.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter++}`;
  }
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceWithChecklist> {
  if (!input.ownerUserId) {
    throw new Error("Owner user ID is required");
  }

  if (!input.name?.trim()) {
    throw new Error("Workspace name is required");
  }

  const slug = await generateUniqueSlug(input.name);
  const checklistItems: WorkspaceWithChecklist["gettingStarted"] = [];

  const workspace = await db.$transaction(async (tx) => {
    const space = await tx.space.create({
      data: {
        name: input.name.trim(),
        slug,
        ownerUserId: input.ownerUserId,
        currency: input.currency ?? "EUR",
        timezone: input.timezone ?? "UTC",
        locale: input.locale ?? "en-US",
        spaceType: SpaceType.PERSONAL,
      },
    });

    await tx.spaceMembership.create({
      data: {
        userId: input.ownerUserId,
        spaceId: space.id,
        role: MembershipRole.OWNER,
      },
    });

    for (const [index, item] of GETTING_STARTED_CHECKLIST.entries()) {
      const createdItem = await tx.inboxItem.create({
        data: {
          spaceId: space.id,
          type: item.type ?? InboxItemType.GENERAL,
          title: item.title,
          description: item.description,
          metadata: {
            checklist: "getting-started",
            order: index + 1,
          },
          status: InboxItemStatus.OPEN,
        },
      });
      checklistItems.push(createdItem);
    }

    return space;
  });

  return { workspace, gettingStarted: checklistItems };
}
