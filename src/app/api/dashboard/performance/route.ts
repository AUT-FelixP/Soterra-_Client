import { NextRequest, NextResponse } from "next/server";
import { getDashboardPerformancePage } from "@/lib/dashboardAppData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    getDashboardPerformancePage(searchParams.get("inspectionType") ?? "All types")
  );
}
