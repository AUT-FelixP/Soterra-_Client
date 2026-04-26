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

  const { email, username, password } = body as {
    email?: string;
    username?: string;
    password?: string;
  };

  const identity = String(email ?? username ?? "").trim();
  if (!identity || !String(password ?? "").trim()) {
    return Response.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const backendResponse = await fetch(new URL("/auth/login", backendBaseUrl()), {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email: identity, password }),
    cache: "no-store",
  });

  const payload = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    return Response.json(
      { message: payload?.detail ?? payload?.message ?? "Invalid credentials." },
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
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${AUTH_COOKIE_VALUE}; Path=/; SameSite=Lax`
  );
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeSession(session)}; Path=/; SameSite=Lax; HttpOnly`
  );

  return Response.json(
    {
      message: "Logged in.",
      user: publicSession(session),
    },
    { status: 200, headers }
  );
}
