import { NextResponse } from "next/server";
import { getDashboardUpcomingRisk } from "@/lib/dashboardData";

export async function GET() {
  return NextResponse.json(getDashboardUpcomingRisk());
}
