import { NextRequest, NextResponse } from "next/server";
import { createInboxItem, getOpenInboxItems } from "@/modules/tasks/services";
import { getCurrentUserWithSpace } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const items = await getOpenInboxItems(space.id);
    return NextResponse.json(items);
  } catch (error) {
    console.error("List inbox items error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch inbox items";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const body = await req.json();
    const item = await createInboxItem(space.id, body);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create inbox item error:", error);
    const message = error instanceof Error ? error.message : "Failed to create inbox item";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
