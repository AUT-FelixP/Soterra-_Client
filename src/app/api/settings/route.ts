import { NextRequest, NextResponse } from "next/server";

type SettingsPayload = {
  name?: string;
  email?: string;
  orgName?: string;
  notifications?: {
    emailReports?: boolean;
    riskAlerts?: boolean;
    weeklyDigest?: boolean;
    productUpdates?: boolean;
  };
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SettingsPayload | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const orgName = String(body.orgName ?? "").trim();

  if (!name || !email || !orgName) {
    return NextResponse.json(
      { error: "Name, email, and organisation name are required." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Settings saved (mock).",
    item: {
      name,
      email,
      orgName,
      notifications: {
        emailReports: Boolean(body.notifications?.emailReports),
        riskAlerts: Boolean(body.notifications?.riskAlerts),
        weeklyDigest: Boolean(body.notifications?.weeklyDigest),
        productUpdates: Boolean(body.notifications?.productUpdates),
      },
    },
    savedAt: new Date().toISOString(),
  });
}
