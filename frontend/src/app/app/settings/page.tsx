"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";
import type { PublicAppSession } from "@/lib/auth";

const THEME_STORAGE_KEY = "soterra-theme";

type ThemeMode = "dark" | "light";

export default function SettingsPage() {
  const [session, setSession] = useState<PublicAppSession | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  });

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setSession(payload?.user ?? null))
      .catch(() => null);
    fetch("/api/tenant/members", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setMembers(payload?.items ?? []))
      .catch(() => null);
  }, []);

  function applyTheme(nextTheme: ThemeMode) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMemberError(null);
    const password = String(form.get("password") ?? "");
    if (password.length < 12) {
      setMemberError("Temporary password must be at least 12 characters.");
      return;
    }

    const response = await fetch("/api/tenant/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        password,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMemberError(payload?.message ?? "Unable to invite member.");
      return;
    }
    setMembers((current) => [...current, payload.item]);
    event.currentTarget.reset();
  }

  async function removeMember(userId: string) {
    const response = await fetch(`/api/tenant/members/${userId}`, { method: "DELETE" });
    if (response.ok) {
      setMembers((current) => current.filter((member) => member.id !== userId));
    }
  }

  if (session?.role === "member") {
    return (
      <div className="space-y-3">
        <p className="text-xs/6 font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
          Settings
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Admin access required
        </h1>
        <p className="max-w-2xl text-sm/6 text-slate-600 dark:text-slate-300">
          Tenant settings and member management are available to admin users only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs/6 font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
          Settings
        </p>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2rem]">
            Appearance
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm/6 text-slate-600 dark:text-slate-300">
            Dark mode is the default across the app. You can switch to light mode here at any time.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <div className="border-b border-slate-200 pb-3.5 dark:border-white/10">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Theme</h2>
          <p className="mt-1 text-sm/6 text-slate-600 dark:text-slate-400">
            Choose how the dashboard looks for you.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ThemeCard
            title="Dark"
            description="Best for low-light use and matches the main app experience."
            icon={<MoonIcon className="size-5" aria-hidden="true" />}
            selected={theme === "dark"}
            onClick={() => applyTheme("dark")}
          />
          <ThemeCard
            title="Light"
            description="Use a lighter interface if you prefer brighter surfaces."
            icon={<SunIcon className="size-5" aria-hidden="true" />}
            selected={theme === "light"}
            onClick={() => applyTheme("light")}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <div className="border-b border-slate-200 pb-3.5 dark:border-white/10">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Members</h2>
          <p className="mt-1 text-sm/6 text-slate-600 dark:text-slate-400">
            Invite team members into {session?.tenantName ?? "this tenant"}.
          </p>
        </div>

        <form onSubmit={inviteMember} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input name="name" required placeholder="Name" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          <input name="email" required type="email" placeholder="Email" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          <input name="password" required minLength={12} type="password" placeholder="Temporary password" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Invite
          </button>
        </form>
        {memberError ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{memberError}</p> : null}

        <div className="mt-5 divide-y divide-slate-200 dark:divide-white/10">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{member.email} · {member.role}</p>
              </div>
              {member.role !== "admin" ? (
                <button type="button" onClick={() => removeMember(member.id)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard(props: {
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-xl border px-4 py-4 text-left transition ${
        props.selected
          ? "border-indigo-300 bg-indigo-50 text-slate-900 ring-2 ring-indigo-500/20 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-white"
          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/55 dark:text-white dark:hover:bg-white/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white/10">
          {props.icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{props.title}</p>
          <p className="mt-1 text-sm/6 text-slate-600 dark:text-slate-300">{props.description}</p>
        </div>
      </div>
    </button>
  );
}
