import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "./components/AppShell";
import { AUTH_COOKIE, AUTH_COOKIE_VALUE } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE);

  if (authCookie?.value !== AUTH_COOKIE_VALUE) {
    redirect("/auth/sign-in");
  }

  return <AppShell>{children}</AppShell>;
}
