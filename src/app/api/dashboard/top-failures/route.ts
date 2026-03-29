import { NextRequest, NextResponse } from "next/server";
import { getDashboardTopFailures } from "@/lib/dashboardData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inspectionType = searchParams.get("inspectionType") ?? undefined;

  return NextResponse.json(getDashboardTopFailures(inspectionType));
}
