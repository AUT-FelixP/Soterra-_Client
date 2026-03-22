import { NextRequest, NextResponse } from "next/server";
import { getReports } from "@/lib/mockReports";
import { addIssue, getIssueById, updateIssue } from "@/lib/mockIssues";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = getIssueById(id) ?? seedIssueFromReport(id);

  if (!item) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body?.status;

  seedIssueFromReport(id);
  const item = updateIssue(id, {
    status: status === "Open" || status === "Closed" ? status : undefined,
  });

  if (!item) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

function seedIssueFromReport(id: string) {
  const report = getReports().find((entry) =>
    entry.issues.some((issue) => issue.id === id)
  );
  const reportIssue = report?.issues.find((issue) => issue.id === id);

  if (!report || !reportIssue) {
    return null;
  }

  return getIssueById(id) ?? addIssue({
    id: reportIssue.id,
    description: reportIssue.title,
    site: report.site,
    dateIdentified: report.createdAt,
    status: "Open",
    reinspections: 0,
  });
}
