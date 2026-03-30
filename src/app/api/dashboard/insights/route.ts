import { NextRequest, NextResponse } from "next/server";
import { getDashboardInsightsPage } from "@/lib/dashboardAppData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    getDashboardInsightsPage(
      searchParams.get("inspectionType") ?? "All inspection types"
    )
  );
}
