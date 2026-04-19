import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "The settings page has been removed because it was not backed by the inspection backend." },
    { status: 410 }
  );
}
