import { NextRequest, NextResponse } from "next/server";
import { getRisks } from "@/lib/mockRisks";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : null;

  let items = getRisks();
  if (status) {
    items = items.filter(
      (risk) => risk.status.toLowerCase() === status.toLowerCase()
    );
  }
  if (severity) {
    items = items.filter(
      (risk) => risk.severity.toLowerCase() === severity.toLowerCase()
    );
  }
  if (limit !== null && !Number.isNaN(limit)) {
    items = items.slice(0, Math.max(0, limit));
  }

  return NextResponse.json({ items });
}
