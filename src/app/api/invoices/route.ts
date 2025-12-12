import { NextRequest, NextResponse } from "next/server";
import { createInvoice, listInvoices } from "@/modules/finance/services";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { createInvoiceSchema, invoiceFiltersSchema } from "@/lib/schemas";
import { InvoiceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    // Parse query parameters for filters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const period = searchParams.get("period");

    // Validate filters
    const filters = invoiceFiltersSchema.parse({
      status: status ? (status as InvoiceStatus) : undefined,
      period,
    });

    // Build filters object for the service
    const serviceFilters: any = {};

    if (filters.status) {
      serviceFilters.status = filters.status;
    }

    // Handle period filter (YYYY-MM or YYYY format)
    if (filters.period) {
      const periodMatch = filters.period.match(/^(\d{4})(?:-(\d{2}))?$/);
      if (periodMatch) {
        const year = parseInt(periodMatch[1]);
        const month = periodMatch[2] ? parseInt(periodMatch[2]) - 1 : 0; // JS months are 0-indexed

        if (periodMatch[2]) {
          // YYYY-MM format - filter for specific month
          const fromDate = new Date(year, month, 1);
          const toDate = new Date(year, month + 1, 0); // Last day of month
          serviceFilters.fromDate = fromDate;
          serviceFilters.toDate = toDate;
        } else {
          // YYYY format - filter for entire year
          const fromDate = new Date(year, 0, 1);
          const toDate = new Date(year, 11, 31);
          serviceFilters.fromDate = fromDate;
          serviceFilters.toDate = toDate;
        }
      }
    }

    const invoices = await listInvoices(space.id, serviceFilters);
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

    // Validate request body with Zod schema
    const validatedData = createInvoiceSchema.parse(body);

    const invoice = await createInvoice(space.id, validatedData);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to create invoice";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
