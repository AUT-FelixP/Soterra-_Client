import { NextResponse } from "next/server";
import {
  getDashboardInsightsPreview,
  getDashboardLiveTracker,
  getDashboardOverview,
  getDashboardTopFailures,
  getDashboardUpcomingRisk,
} from "@/lib/dashboardData";

export async function GET() {
  return NextResponse.json({
    overview: getDashboardOverview(),
    liveTracker: getDashboardLiveTracker(),
    upcomingRisk: getDashboardUpcomingRisk(),
    topFailures: getDashboardTopFailures(),
    insightsPreview: getDashboardInsightsPreview(),
  });
}
