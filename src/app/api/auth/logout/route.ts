import { AUTH_COOKIE } from "@/lib/auth";

export async function POST() {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  );

  return Response.json({ message: "Logged out." }, { status: 200, headers });
}
