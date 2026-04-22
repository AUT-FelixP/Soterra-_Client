import { AUTH_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  );
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`
  );

  return Response.json({ message: "Logged out." }, { status: 200, headers });
}
