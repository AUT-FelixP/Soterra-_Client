import { AUTH_COOKIE, AUTH_COOKIE_VALUE } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid payload." }, { status: 400 });
  }

  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!String(name ?? "").trim() || !String(email ?? "").trim() || !String(password ?? "").trim()) {
    return Response.json({ message: "Missing required fields." }, { status: 400 });
  }

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=${AUTH_COOKIE_VALUE}; Path=/; SameSite=Lax`
  );

  return Response.json({ message: "Registered." }, { status: 200, headers });
}
