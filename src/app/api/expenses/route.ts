import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { createExpense, listExpenses } from "@/modules/finance/services";

type ExpenseFilters = {
  category?: string;
  projectLink?: string;
  fromDate?: Date;
  toDate?: Date;
};

export async function GET(req: NextRequest) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const projectLink = searchParams.get("project") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const filters: ExpenseFilters = {};
    if (category) filters.category = category;
    if (projectLink) filters.projectLink = projectLink;
    if (from) filters.fromDate = new Date(from);
    if (to) filters.toDate = new Date(to);

    const expenses = await listExpenses(space.id, filters);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("List expenses error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch expenses";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const body = await req.json();

    if (!body.vendor || !body.category || typeof body.amount !== "number" || !body.date) {
      return NextResponse.json({ error: "vendor, category, amount, and date are required" }, { status: 400 });
    }

    const expense = await createExpense(space.id, {
      vendor: body.vendor,
      category: body.category,
      amount: body.amount,
      currency: body.currency,
      date: new Date(body.date),
      taxAmount: body.taxAmount,
      projectLink: body.projectLink,
      billable: body.billable,
      notes: body.notes,
      fxRate: body.fxRate,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    const message = error instanceof Error ? error.message : "Failed to create expense";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
