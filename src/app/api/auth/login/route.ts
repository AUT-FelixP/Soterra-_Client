import { AUTH_COOKIE, AUTH_COOKIE_VALUE } from "@/lib/auth";

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

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${AUTH_COOKIE_VALUE}; Path=/; SameSite=Lax`
  );

  return Response.json(
    {
      message: "Logged in.",
    },
    { status: 200, headers }
  );
}
