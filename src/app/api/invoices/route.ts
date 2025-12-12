import { NextRequest, NextResponse } from "next/server";
import { createInvoice, listInvoices } from "@/modules/finance/services";
import { getCurrentUserWithSpace } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const invoices = await listInvoices(space.id);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("List invoices error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch invoices";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const body = await req.json();
    const invoice = await createInvoice(space.id, body);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
