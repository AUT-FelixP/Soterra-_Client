import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/dashboardData";

export async function GET() {
  return NextResponse.json({
    items: getDashboardOverview(),
  });
}
