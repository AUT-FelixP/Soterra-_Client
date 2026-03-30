import { NextRequest, NextResponse } from "next/server";
import { getDashboardProjectPage } from "@/lib/dashboardAppData";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = getDashboardProjectPage(slug);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}
