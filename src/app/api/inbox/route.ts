import { NextRequest, NextResponse } from "next/server";
import { listInboxItems } from "@/modules/tasks/services";

export async function GET(req: NextRequest) {
  try {
    const spaceId = req.headers.get("x-space-id");

    if (!spaceId) {
      return NextResponse.json({ error: "Space ID required" }, { status: 400 });
    }

    const items = await listInboxItems(spaceId);
    return NextResponse.json(items);
  } catch (error) {
    console.error("List inbox items error:", error);
    return NextResponse.json({ error: "Failed to fetch inbox items" }, { status: 500 });
  }
}
