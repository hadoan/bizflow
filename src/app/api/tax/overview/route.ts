import { NextRequest, NextResponse } from "next/server";
import { getTaxOverview } from "@/modules/finance/services";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { taxOverviewQuerySchema, taxOverviewBodySchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryData = {
      year: searchParams.get("year"),
      periodType: searchParams.get("periodType"),
      periodValue: searchParams.get("periodValue"),
    };

    // Validate query parameters
    const { year, periodType, periodValue } = taxOverviewQuerySchema.parse(queryData);

    // Get tax overview
    const overview = await getTaxOverview(space.id, year, periodType, periodValue);

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Tax overview API error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch tax overview";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    // Parse JSON body
    const body = await req.json();

    // Validate request body
    const { year, periodType, periodValue } = taxOverviewBodySchema.parse(body);

    // Get tax overview
    const overview = await getTaxOverview(space.id, year, periodType, periodValue);

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Tax overview API error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch tax overview";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}