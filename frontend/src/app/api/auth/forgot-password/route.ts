function backendBaseUrl() {
  return process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8001";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid payload." }, { status: 400 });
  }

  const { email } = body as { email?: string };
  if (!String(email ?? "").trim()) {
    return Response.json({ message: "Email is required." }, { status: 400 });
  }

  const backendResponse = await fetch(new URL("/auth/forgot-password", backendBaseUrl()), {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  const payload = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    return Response.json(
      { message: payload?.detail ?? payload?.message ?? "Unable to request password reset." },
      { status: backendResponse.status }
    );
  }

  return Response.json(payload ?? { message: "If an account exists for this email, a reset link has been sent." });
}
