import { NextRequest, NextResponse } from "next/server";
import { getRiskById, updateRisk } from "@/lib/mockRisks";

const ALLOWED_STATUS = ["Open", "Investigating", "Resolved"] as const;
type AllowedStatus = (typeof ALLOWED_STATUS)[number];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const risk = getRiskById(id);
  if (!risk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ item: risk });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const status = payload.status;
  const owner = payload.owner;

  const updates: { status?: AllowedStatus; owner?: string } = {};
  if (typeof status === "string" && ALLOWED_STATUS.includes(status as AllowedStatus)) {
    updates.status = status as AllowedStatus;
  }
  if (typeof owner === "string" && owner.trim()) {
    updates.owner = owner.trim();
  }
  if (!updates.status && !updates.owner) {
    return NextResponse.json(
      { error: "No supported fields to update" },
      { status: 400 }
    );
  }

  const updated = updateRisk(id, updates);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}
