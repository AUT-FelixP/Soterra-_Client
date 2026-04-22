import { AUTH_COOKIE, AUTH_COOKIE_VALUE, SESSION_COOKIE, type AppSession } from "@/lib/auth";
import { encodeSession } from "@/lib/backendProxy";

function backendBaseUrl() {
  return process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8001";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid payload." }, { status: 400 });
  }

  const { name, email, password, tenantName } = body as {
    name?: string;
    email?: string;
    password?: string;
    tenantName?: string;
  };

  if (!String(tenantName ?? "").trim() || !String(name ?? "").trim() || !String(email ?? "").trim() || !String(password ?? "").trim()) {
    return Response.json({ message: "Missing required fields." }, { status: 400 });
  }

  const backendResponse = await fetch(new URL("/auth/register", backendBaseUrl()), {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ tenantName, name, email, password }),
    cache: "no-store",
  });

  const payload = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    return Response.json(
      { message: payload?.detail ?? payload?.message ?? "Unable to create account." },
      { status: backendResponse.status }
    );
  }

  const user = payload?.user;
  const session: AppSession = {
    userId: user.id,
    tenantId: user.tenant_id,
    tenantName: user.tenant_name,
    name: user.name,
    email: user.email,
    role: user.role,
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

  return Response.json({ message: "Registered.", user: session }, { status: 200, headers });
}
