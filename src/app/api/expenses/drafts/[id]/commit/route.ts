import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { commitExpenseDraft } from "@/modules/finance/services/expense-agent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { id: draftId } = await params;
    const updates = await req.json();

    const expense = await commitExpenseDraft(space.id, draftId, updates);

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Commit draft error:", error);
    const message = error instanceof Error ? error.message : "Failed to commit draft";
    const status = message === "Unauthorized" ? 401 : message === "Draft not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
