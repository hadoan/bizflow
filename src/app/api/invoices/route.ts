import { NextRequest, NextResponse } from "next/server";
import { createInvoice, listInvoices } from "@/modules/finance/services";

export async function GET(req: NextRequest) {
  try {
    const spaceId = req.headers.get("x-space-id");

    if (!spaceId) {
      return NextResponse.json({ error: "Space ID required" }, { status: 400 });
    }

    const invoices = await listInvoices(spaceId);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const spaceId = req.headers.get("x-space-id");

    if (!spaceId) {
      return NextResponse.json({ error: "Space ID required" }, { status: 400 });
    }

    const body = await req.json();
    const invoice = await createInvoice(spaceId, body);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
