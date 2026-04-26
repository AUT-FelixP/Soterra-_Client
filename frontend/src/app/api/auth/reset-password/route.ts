import { AUTH_COOKIE, AUTH_COOKIE_VALUE, SESSION_COOKIE, type AppSession } from "@/lib/auth";
import { encodeSession, publicSession } from "@/lib/backendProxy";

function backendBaseUrl() {
  return process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8001";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid payload." }, { status: 400 });
  }

  const { token, password } = body as { token?: string; password?: string };
  if (!String(token ?? "").trim() || !String(password ?? "").trim()) {
    return Response.json({ message: "Token and password are required." }, { status: 400 });
  }

  const backendResponse = await fetch(new URL("/auth/reset-password", backendBaseUrl()), {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ token, password }),
    cache: "no-store",
  });

  const payload = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    return Response.json(
      { message: payload?.detail ?? payload?.message ?? "Unable to reset password." },
      { status: backendResponse.status }
    );
  }

  const user = payload?.user;
  const accessToken = payload?.access_token;
  if (!user?.id || !user?.tenant_id || !accessToken) {
    return Response.json({ message: "Invalid session returned by backend." }, { status: 502 });
  }

  const session: AppSession = {
    userId: user.id,
    tenantId: user.tenant_id,
    tenantName: user.tenant_name,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
    expiresAt: payload?.expires_at,
  };

  const headers = new Headers();
  headers.append("Set-Cookie", `${AUTH_COOKIE}=${AUTH_COOKIE_VALUE}; Path=/; SameSite=Lax`);
  headers.append("Set-Cookie", `${SESSION_COOKIE}=${encodeSession(session)}; Path=/; SameSite=Lax; HttpOnly`);

  return Response.json({ message: "Password reset.", user: publicSession(session) }, { status: 200, headers });
}
