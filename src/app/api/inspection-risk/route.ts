import { NextRequest, NextResponse } from "next/server";
import { getInspectionRiskData } from "@/lib/inspectionRiskData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  return NextResponse.json(
    getInspectionRiskData({
      site: searchParams.get("site") ?? undefined,
      dateRange: searchParams.get("dateRange") ?? undefined,
      inspectionType: searchParams.get("inspectionType") ?? undefined,
    })
  );
}
