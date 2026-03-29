import { NextResponse } from "next/server";
import { getDashboardInsightsPreview } from "@/lib/dashboardData";

export async function GET() {
  return NextResponse.json(getDashboardInsightsPreview());
}
