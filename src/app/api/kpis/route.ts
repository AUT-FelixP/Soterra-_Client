import { NextResponse } from "next/server";

const KPIS = [
  { name: "Reports processed", value: "2,418" },
  { name: "Issues identified", value: "324" },
  { name: "Avg. time saved", value: "37", unit: "%" },
  { name: "Active projects", value: "42" },
];

export async function GET() {
  return NextResponse.json(KPIS);
}
