"use client";

import { useEffect, useMemo, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { classNames } from "@/lib/classNames";

type SettingsForm = {
  name: string;
  email: string;
  orgName: string;
  notifications: {
    emailReports: boolean;
    riskAlerts: boolean;
    weeklyDigest: boolean;
    productUpdates: boolean;
  };
};

const defaultForm: SettingsForm = {
  name: "Sam Carter",
  email: "sam.carter@example.com",
  orgName: "Soterra Projects",
  notifications: {
    emailReports: true,
    riskAlerts: true,
    weeklyDigest: false,
    productUpdates: false,
  },
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  const canSave = useMemo(
    () =>
      form.name.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.orgName.trim().length > 0,
    [form]
  );

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = setTimeout(() => setToastOpen(false), 2600);
    return () => clearTimeout(timeout);
  }, [toastOpen]);

  const updateNotification = (key: keyof SettingsForm["notifications"]) => {
    setForm((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Unable to save settings.");
        return;
      }

      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Profile, organisation preferences, and notifications.
          </p>
        </div>

        {error ? (
          <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-500/10 dark:outline dark:outline-yellow-500/15">
            <div className="flex">
              <div className="shrink-0">
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="size-5 text-yellow-400 dark:text-yellow-300"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-100">
                  Attention needed
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-100/80">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Profile
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Update your public profile details.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Email
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Organisation
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Configure your organisation details.
              </p>

              <div className="mt-6 max-w-lg">
                <label
                  htmlFor="orgName"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Organisation name
                </label>
                <div className="mt-2">
                  <input
                    id="orgName"
                    name="orgName"
                    value={form.orgName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, orgName: event.target.value }))
                    }
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Choose what updates you receive.
              </p>

              <div className="mt-6 space-y-5">
                {[
                  ["emailReports", "Email reports", "Send periodic inspection summaries via email."],
                  ["riskAlerts", "Risk alerts", "Notify immediately when high-risk items are detected."],
                  ["weeklyDigest", "Weekly digest", "Send a weekly roll-up of activity and metrics."],
                  ["productUpdates", "Product updates", "Receive release notes and feature announcements."],
                ].map(([key, label, description]) => {
                  const checked =
                    form.notifications[key as keyof SettingsForm["notifications"]];

                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[1fr_auto] items-start gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {label}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {description}
                        </p>
                      </div>
                      <div className="group relative mt-0.5 inline-flex w-11 shrink-0 justify-self-end rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 dark:bg-white/5 dark:inset-ring-white/10 dark:outline-indigo-500 dark:has-checked:bg-indigo-500">
                        <span className="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5" />
                        <input
                          checked={checked}
                          onChange={() =>
                            updateNotification(
                              key as keyof SettingsForm["notifications"]
                            )
                          }
                          name={key}
                          type="checkbox"
                          aria-label={label}
                          className="absolute inset-0 size-full appearance-none focus:outline-hidden"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-3">
            <button
              type="button"
              onClick={() => {
                setForm(defaultForm);
                setError(null);
              }}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!canSave || saving}
              className={classNames(
                !canSave || saving ? "opacity-60 cursor-not-allowed" : "",
                "rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:focus-visible:outline-indigo-500"
              )}
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </form>
      </div>

      <div
        className={classNames(
          toastOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
          "fixed right-4 bottom-4 z-50 transition-all duration-200"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg dark:bg-emerald-500/15 dark:text-emerald-100 dark:outline dark:outline-emerald-500/20">
          Settings saved successfully.
        </div>
      </div>
    </>
  );
}
