import { NextResponse } from "next/server";
import { getTrackerDashboardSummary } from "@/lib/trackerPageData";

export async function GET() {
  return NextResponse.json(getTrackerDashboardSummary());
}
