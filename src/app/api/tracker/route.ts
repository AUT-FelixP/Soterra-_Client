import { NextRequest, NextResponse } from "next/server";
import { getTrackerPageData } from "@/lib/trackerPageData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  return NextResponse.json(
    getTrackerPageData({
      site: searchParams.get("site") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      dateRange: searchParams.get("dateRange") ?? undefined,
      issueId: searchParams.get("issueId") ?? undefined,
    })
  );
}
