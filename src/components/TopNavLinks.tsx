import Link from "next/link";
import { cookies } from "next/headers";
import { AUTH_COOKIE, AUTH_COOKIE_VALUE } from "@/lib/auth";

export default async function TopNavLinks() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get(AUTH_COOKIE)?.value === AUTH_COOKIE_VALUE;

  return (
    <div className="hidden items-center gap-4 text-sm font-semibold text-gray-600 sm:flex dark:text-gray-300">
      {hasSession ? (
        <Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-white">
          Dashboard
        </Link>
      ) : (
        <Link href="/login" className="hover:text-gray-900 dark:hover:text-white">
          Login
        </Link>
      )}
    </div>
  );
}
