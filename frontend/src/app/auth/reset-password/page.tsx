"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_STORAGE_KEY } from "@/lib/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordShell />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordShell() {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="brand-glow text-center text-2xl font-semibold text-gray-900 dark:text-white">Soterra</div>
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          Choose a new password
        </h2>
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get("token") ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Unable to reset password.");
        return;
      }
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      router.push("/app");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="brand-glow text-center text-2xl font-semibold text-gray-900 dark:text-white">Soterra</div>
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          Choose a new password
        </h2>
      </div>

      <div className="mt-10 mx-auto w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
              New password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
            </div>
          </div>

          {!token ? <p className="text-sm text-rose-600 dark:text-rose-300">Password reset token is missing.</p> : null}
          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !token}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
          >
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
