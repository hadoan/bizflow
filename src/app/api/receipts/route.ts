import { NextRequest, NextResponse } from "next/server";
import { createReceipt, listReceipts } from "@/modules/finance/services";

export async function GET(req: NextRequest) {
  try {
    const spaceId = req.headers.get("x-space-id");

    if (!spaceId) {
      return NextResponse.json({ error: "Space ID required" }, { status: 400 });
    }

    const receipts = await listReceipts(spaceId);
    return NextResponse.json(receipts);
  } catch (error) {
    console.error("List receipts error:", error);
    return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const spaceId = req.headers.get("x-space-id");

    if (!spaceId) {
      return NextResponse.json({ error: "Space ID required" }, { status: 400 });
    }

    const body = await req.json();
    const receipt = await createReceipt(spaceId, body);

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Create receipt error:", error);
    return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
  }
}
