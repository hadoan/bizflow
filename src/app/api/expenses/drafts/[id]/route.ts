import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithSpace } from "@/lib/auth";
import {
  updateExpenseDraft,
  discardExpenseDraft,
} from "@/modules/finance/services/expense-agent";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { id: draftId } = await params;
    const updates = await req.json();

    const draft = await updateExpenseDraft(space.id, draftId, updates);

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Update draft error:", error);
    const message = error instanceof Error ? error.message : "Failed to update draft";
    const status = message === "Unauthorized" ? 401 : message === "Draft not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { id: draftId } = await params;

    await discardExpenseDraft(space.id, draftId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete draft error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete draft";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
