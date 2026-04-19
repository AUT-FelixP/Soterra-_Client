"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useState } from "react";

const THEME_STORAGE_KEY = "soterra-theme";

type ThemeMode = "dark" | "light";

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  });

  function applyTheme(nextTheme: ThemeMode) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
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
