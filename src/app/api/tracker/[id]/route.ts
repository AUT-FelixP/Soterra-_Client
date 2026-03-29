import { NextRequest, NextResponse } from "next/server";
import {
  getTrackerIssueById,
  updateTrackerIssue,
} from "@/lib/trackerPageData";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const issue = getTrackerIssueById(id);

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ item: issue });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body?.status;
  const reinspections = body?.reinspections;
  const lastSentTo = body?.lastSentTo;

  const item = updateTrackerIssue(id, {
    status:
      status === "Open" || status === "Ready" || status === "Closed"
        ? status
        : undefined,
    reinspections:
      typeof reinspections === "number" && reinspections >= 0
        ? reinspections
        : undefined,
    lastSentTo:
      lastSentTo === "subcontractor" || lastSentTo === "consultant"
        ? lastSentTo
        : undefined,
  });

  if (!item) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
