import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { getExpense, updateExpense } from "@/modules/finance/services";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { id } = await params;
    const expense = await getExpense(space.id, id);
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Get expense error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch expense";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { id } = await params;
    const body = await req.json();

    const amount =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.amount === "string" && body.amount.trim() !== ""
          ? parseFloat(body.amount)
          : undefined;

    if (amount !== undefined && Number.isNaN(amount)) {
      return NextResponse.json({ error: "Amount must be a number" }, { status: 400 });
    }

    const expense = await updateExpense(space.id, id, {
      vendor: body.vendor,
      category: body.category,
      amount,
      currency: body.currency,
      date: body.date ? new Date(body.date) : undefined,
      taxAmount: body.taxAmount ?? undefined,
      projectLink: body.projectLink,
      billable: typeof body.billable === "boolean" ? body.billable : undefined,
      notes: body.notes,
      fxRate: body.fxRate ?? undefined,
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Update expense error:", error);
    const message = error instanceof Error ? error.message : "Failed to update expense";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
