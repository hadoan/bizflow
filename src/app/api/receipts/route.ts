import { NextRequest, NextResponse } from "next/server";
import { createReceipt, listReceipts } from "@/modules/finance/services";
import { getCurrentUserWithSpace } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const receipts = await listReceipts(space.id);
    return NextResponse.json(receipts);
  } catch (error) {
    console.error("List receipts error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch receipts";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const body = await req.json();
    const receipt = await createReceipt(space.id, body);

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Create receipt error:", error);
    const message = error instanceof Error ? error.message : "Failed to create receipt";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
