"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    setSubmitting(true);
    setError(null);
    setMessage(null);
    setDevResetLink(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.message ?? "Unable to request password reset.");
        return;
      }
      setMessage(payload?.message ?? "If an account exists for this email, a reset link has been sent.");
      if (payload?.resetToken) {
        setDevResetLink(`/auth/reset-password?token=${encodeURIComponent(payload.resetToken)}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="brand-glow text-center text-2xl font-semibold text-gray-900 dark:text-white">Soterra</div>
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          Reset your password
        </h2>
      </div>

      <div className="mt-10 mx-auto w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
          {devResetLink ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-semibold">Email is not configured locally.</p>
              <Link href={devResetLink} className="mt-1 inline-block font-semibold underline underline-offset-4">
                Open password reset link
              </Link>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          <Link href="/auth/sign-in" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
