import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getUserSpaces } from "@/lib/auth";
import { createWorkspace } from "@/modules/workspaces/services";

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      throw new Error("Unauthorized");
    }

    const workspaces = await getUserSpaces(user.id);
    return NextResponse.json(workspaces);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch workspaces";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user?.id) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const { name, currency, timezone, locale } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const result = await createWorkspace({
      name,
      currency,
      timezone,
      locale,
      ownerUserId: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create workspace error:", error);
    const message = error instanceof Error ? error.message : "Failed to create workspace";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
