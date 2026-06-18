"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import AnimatedAppBackground from "../../app/components/AnimatedAppBackground";

export default function SignInPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message ?? "Unable to sign in.");
        return;
      }

      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      router.push("/app");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-white text-slate-950 dark:bg-[#050505] dark:text-white">
      <AnimatedAppBackground />
      <main className="relative z-10 flex min-h-full items-center justify-center px-6 py-10 lg:px-8">
        <section className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-7 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:p-9 dark:border-white/10 dark:bg-[#0b0b0d]/88 dark:shadow-black/35">
          <div className="flex items-center justify-center gap-3">
            <span className="brand-mark size-10 rounded-xl text-base font-semibold text-white">
              S
            </span>
            <span className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Soterra
            </span>
          </div>
          <div className="mt-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
              Welcome back
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Continue to your inspection workspace.
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mt-8">
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-slate-700 dark:text-slate-200"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-lg bg-white px-3.5 py-2.5 text-base text-slate-950 outline-1 -outline-offset-1 outline-slate-300 transition focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/[0.055] dark:text-white dark:outline-white/10 dark:focus:bg-white/[0.075] dark:focus:outline-indigo-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-slate-700 dark:text-slate-200"
              >
                Password
              </label>
              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full rounded-lg bg-white px-3.5 py-2.5 text-base text-slate-950 outline-1 -outline-offset-1 outline-slate-300 transition focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/[0.055] dark:text-white dark:outline-white/10 dark:focus:bg-white/[0.075] dark:focus:outline-indigo-400"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
          ) : null}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-sm/6 font-semibold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm/6 text-slate-500 dark:text-slate-400">
          Not a member?{" "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            Create an account
          </Link>
        </p>
        </section>
      </main>
    </div>
  );
}
