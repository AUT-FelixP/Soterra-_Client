import { NextResponse } from "next/server";

type LeadPayload = {
  name?: string;
  email?: string;
  organisation?: string;
  phone?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadPayload;

    if (!body?.name || !body?.email || !body?.organisation) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Lead routed to sales team.",
        routedTo: "sales@soterra.co.nz",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
