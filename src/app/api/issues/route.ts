import { NextRequest, NextResponse } from "next/server";
import { getTrackerIssues } from "@/lib/trackerIssues";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  let items = getTrackerIssues();

  if (status) {
    items = items.filter(
      (issue) => issue.status.toLowerCase() === status.toLowerCase()
    );
  }

  return NextResponse.json({ items });
}
