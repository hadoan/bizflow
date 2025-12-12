import { NextRequest, NextResponse } from "next/server";
import { getTaxOverview, getTaxPeriods } from "@/modules/finance/services";
import { TaxPeriodType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const spaceId = req.headers.get("x-space-id");

    if (!spaceId) {
      return NextResponse.json({ error: "Space ID required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const periodType = searchParams.get("periodType") as TaxPeriodType;
    const periodValue = searchParams.get("periodValue");

    if (year && periodType && periodValue) {
      const overview = await getTaxOverview(
        spaceId,
        parseInt(year),
        periodType,
        parseInt(periodValue)
      );
      return NextResponse.json(overview);
    }

    const periods = await getTaxPeriods(spaceId, year ? parseInt(year) : undefined);
    return NextResponse.json(periods);
  } catch (error) {
    console.error("Tax API error:", error);
    return NextResponse.json({ error: "Failed to fetch tax data" }, { status: 500 });
  }
}
