import { NextResponse } from "next/server";
import { getDashboardCompanyPage } from "@/lib/dashboardAppData";

export async function GET() {
  return NextResponse.json(getDashboardCompanyPage());
}
