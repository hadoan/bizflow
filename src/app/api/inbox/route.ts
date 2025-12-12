import { NextRequest, NextResponse } from "next/server";
import { listInboxItems } from "@/modules/tasks/services";
import { getCurrentUserWithSpace } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const items = await listInboxItems(space.id);
    return NextResponse.json(items);
  } catch (error) {
    console.error("List inbox items error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch inbox items";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
