import { NextResponse } from "next/server";
import { getReports } from "@/lib/mockReports";
import { getTrackerIssues } from "@/lib/trackerIssues";

export async function GET() {
  const reports = getReports();
  const projects = new Set(reports.map((report) => report.project)).size;
  const inspections = reports.length;
  const failedItems = getTrackerIssues().length;

  return NextResponse.json({
    items: [
      { name: "Projects", value: String(projects) },
      { name: "Inspections", value: String(inspections) },
      { name: "Failed items", value: String(failedItems) },
    ],
  });
}
