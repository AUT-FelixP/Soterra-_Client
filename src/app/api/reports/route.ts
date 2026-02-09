import { NextRequest, NextResponse } from "next/server";
import { addReport, getReports } from "@/lib/mockReports";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : null;
  const status = searchParams.get("status");
  const site = searchParams.get("site");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let items = getReports();
  if (status) {
    items = items.filter((report) => report.status === status);
  }
  if (site) {
    items = items.filter((report) => report.site === site);
  }
  if (start) {
    items = items.filter((report) => report.createdAt >= start);
  }
  if (end) {
    items = items.filter((report) => report.createdAt <= end);
  }
  if (limit !== null && !Number.isNaN(limit)) {
    items = items.slice(0, Math.max(0, limit));
  }

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const project = String(formData.get("project") ?? "").trim();
    const site = String(formData.get("site") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const inspector = String(formData.get("inspector") ?? "").trim();
    const trade = String(formData.get("trade") ?? "").trim();

    if (!project || !site || !status) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const report = addReport({
      project,
      site,
      status: status as "Reviewing" | "Completed" | "In progress",
      inspector,
      trade,
    });

    return NextResponse.json({ item: report }, { status: 201 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { project, site, status, inspector, trade } = body as {
    project?: string;
    site?: string;
    status?: "Reviewing" | "Completed" | "In progress";
    inspector?: string;
    trade?: string;
  };

  if (!project || !site || !status) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const report = addReport({ project, site, status, inspector, trade });
  return NextResponse.json({ item: report }, { status: 201 });
}
