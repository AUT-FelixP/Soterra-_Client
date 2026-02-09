import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, AUTH_COOKIE_VALUE } from "./src/lib/auth";

export function middleware(request: NextRequest) {
  const hasSession =
    request.cookies.get(AUTH_COOKIE)?.value === AUTH_COOKIE_VALUE;

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
