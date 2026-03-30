import { NextRequest, NextResponse } from "next/server";
import { getDashboardRiskPage } from "@/lib/dashboardAppData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  return NextResponse.json(
    getDashboardRiskPage(
      searchParams.get("site") ?? "All sites",
      searchParams.get("window") ?? "30d",
      searchParams.get("inspectionId") ?? undefined
    )
  );
}
