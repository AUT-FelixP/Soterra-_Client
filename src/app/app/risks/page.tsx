"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { classNames } from "@/lib/classNames";

type Risk = {
  id: string;
  title: string;
  site: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Investigating" | "Resolved";
  owner?: string;
  createdAt: string;
};

const tabs = ["All", "High", "Medium", "Low"] as const;

export default function RisksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const query =
          activeTab === "All"
            ? "/api/risks"
            : `/api/risks?severity=${activeTab.toLowerCase()}`;
        const response = await fetch(query);
        const data = await response.json();
        if (!isMounted) return;
        setRisks(Array.isArray(data) ? data : data?.items ?? []);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const severityBadge = useMemo(
    () => (severity: Risk["severity"]) =>
      classNames(
        severity === "Critical"
          ? "text-rose-700 dark:text-rose-300"
          : severity === "High"
            ? "text-amber-700 dark:text-amber-300"
            : severity === "Medium"
              ? "text-blue-700 dark:text-blue-300"
              : "text-emerald-700 dark:text-emerald-300",
        "inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium inset-ring inset-ring-gray-200 dark:inset-ring-white/10"
      ),
    []
  );

  const statusBadge = useMemo(
    () => (status: Risk["status"]) =>
      classNames(
        status === "Resolved"
          ? "text-emerald-700 dark:text-emerald-300"
          : status === "Investigating"
            ? "text-blue-700 dark:text-blue-300"
            : "text-gray-700 dark:text-gray-300",
        "inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium inset-ring inset-ring-gray-200 dark:inset-ring-white/10"
      ),
    []
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Risks
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          High-risk patterns, repeat defects, and escalation status.
        </p>
      </div>

      <div>
        <div className="grid grid-cols-1 sm:hidden">
          <select
            aria-label="Select risk severity"
            value={activeTab}
            onChange={(event) =>
              setActiveTab(event.target.value as (typeof tabs)[number])
            }
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-gray-100 dark:outline-white/10 dark:*:bg-gray-900 dark:*:text-white dark:focus:outline-indigo-500"
          >
            {tabs.map((tab) => (
              <option key={tab}>{tab}</option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500 dark:fill-gray-400"
          />
        </div>
        <div className="hidden sm:block">
          <nav aria-label="Risk severity tabs" className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={classNames(
                  activeTab === tab
                    ? "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                  "rounded-md px-3 py-2 text-sm font-medium"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-900/70 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Risk</th>
              <th className="px-6 py-3">Site</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Owner</th>
              <th className="px-6 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`risk-loading-${index}`}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 rounded bg-gray-200 dark:bg-white/10 animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              : risks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="even:bg-gray-50 hover:bg-gray-50 dark:even:bg-gray-800/50 dark:hover:bg-gray-800/40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400"
                    onClick={() => router.push(`/app/risks/${risk.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/app/risks/${risk.id}`);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Open risk ${risk.title}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {risk.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {risk.site}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={severityBadge(risk.severity)}>
                        <svg
                          viewBox="0 0 6 6"
                          aria-hidden="true"
                          className={classNames(
                            risk.severity === "Critical"
                              ? "fill-rose-500 dark:fill-rose-400"
                              : risk.severity === "High"
                                ? "fill-amber-500 dark:fill-amber-400"
                                : risk.severity === "Medium"
                                  ? "fill-blue-500 dark:fill-blue-400"
                                  : "fill-emerald-500 dark:fill-emerald-400",
                            "size-1.5"
                          )}
                        >
                          <circle r={3} cx={3} cy={3} />
                        </svg>
                        {risk.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={statusBadge(risk.status)}>
                        <svg
                          viewBox="0 0 6 6"
                          aria-hidden="true"
                          className={classNames(
                            risk.status === "Resolved"
                              ? "fill-emerald-500 dark:fill-emerald-400"
                              : risk.status === "Investigating"
                                ? "fill-blue-500 dark:fill-blue-400"
                                : "fill-gray-500 dark:fill-gray-400",
                            "size-1.5"
                          )}
                        >
                          <circle r={3} cx={3} cy={3} />
                        </svg>
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {risk.owner ?? "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <span className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200">
                        View
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && risks.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No risks found for the selected severity.
          </div>
        ) : null}
      </div>
    </div>
  );
}
