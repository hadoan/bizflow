import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasSpaceAccess } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const spaceId = body?.spaceId as string | undefined;
    if (!spaceId) {
      return NextResponse.json({ error: "spaceId is required" }, { status: 400 });
    }

    const hasAccess = await hasSpaceAccess(user.id, spaceId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this space" }, { status: 403 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { defaultSpaceId: spaceId },
    });

    return NextResponse.json({ success: true, spaceId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to select workspace";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
