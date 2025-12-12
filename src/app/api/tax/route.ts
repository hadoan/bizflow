import { NextRequest, NextResponse } from "next/server";
import { getTaxOverview, getTaxPeriods } from "@/modules/finance/services";
import { TaxPeriodType } from "@prisma/client";
import { getCurrentUserWithSpace } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const periodType = searchParams.get("periodType") as TaxPeriodType;
    const periodValue = searchParams.get("periodValue");

    if (year && periodType && periodValue) {
      const overview = await getTaxOverview(
        space.id,
        parseInt(year),
        periodType,
        parseInt(periodValue)
      );
      return NextResponse.json(overview);
    }

    const periods = await getTaxPeriods(space.id, year ? parseInt(year) : undefined);
    return NextResponse.json(periods);
  } catch (error) {
    console.error("Tax API error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch tax data";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
