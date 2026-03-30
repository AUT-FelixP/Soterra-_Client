import { NextResponse } from "next/server";
import { getDashboardOverviewPage } from "@/lib/dashboardAppData";

export async function GET() {
  return NextResponse.json(getDashboardOverviewPage());
}
