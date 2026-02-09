import { NextRequest, NextResponse } from "next/server";
import { getSites } from "@/lib/mockSites";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let items = getSites();
  if (status) {
    items = items.filter(
      (site) => site.status.toLowerCase() === status.toLowerCase()
    );
  }

  return NextResponse.json({ items });
}
