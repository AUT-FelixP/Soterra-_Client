"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { classNames } from "@/lib/classNames";

type Site = {
  id: string;
  project: string;
  siteName: string;
  status: "On Track" | "Needs Attention" | "Delayed";
  manager: string;
  region: string;
  phase: string;
  openRisks: number;
  highRiskCount: number;
  lastReportDate: string;
  description: string;
  initials: string;
  accent: string;
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/sites");
        const data = await response.json();
        if (!isMounted) return;
        setSites(Array.isArray(data) ? data : data?.items ?? []);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const statusBadge = useMemo(
    () => (status: Site["status"]) =>
      classNames(
        status === "On Track"
          ? "bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400"
          : status === "Needs Attention"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/10 dark:text-yellow-300"
            : "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400",
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
      ),
    []
  );

  const cardRows = loading ? Array.from({ length: 6 }) : sites;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Sites
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Portfolio view of project sites, reporting cadence, and active risk pressure.
        </p>
      </div>

      <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cardRows.map((row, index) =>
          loading ? (
            <li
              key={`site-loading-${index}`}
              className="col-span-1 flex rounded-md shadow-xs dark:shadow-none"
            >
              <div className="flex w-16 shrink-0 items-center justify-center rounded-l-md bg-gray-300 dark:bg-gray-700" />
              <div className="flex flex-1 items-center justify-between rounded-r-md border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800/50">
                <div className="flex-1 px-4 py-3 space-y-2">
                  <div className="h-4 w-36 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                </div>
              </div>
            </li>
          ) : (
            <li key={row.id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
              <div
                className={classNames(
                  row.accent,
                  "flex w-16 shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white"
                )}
              >
                {row.initials}
              </div>
              <div className="flex flex-1 items-center justify-between truncate rounded-r-md border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800/50">
                <div className="flex-1 truncate px-4 py-3 text-sm">
                  <Link
                    href={`/app/sites/${row.id}`}
                    className="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200"
                  >
                    {row.project}
                  </Link>
                  <p className="text-gray-500 dark:text-gray-400">{row.siteName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={statusBadge(row.status)}>{row.status}</span>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-400/10 dark:text-red-400">
                      High risks: {row.highRiskCount}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Last report: {row.lastReportDate}
                  </p>
                </div>
                <div className="shrink-0 pr-2">
                  <Link
                    href={`/app/sites/${row.id}`}
                    className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:hover:text-white dark:focus:outline-white"
                  >
                    <span className="sr-only">Open site</span>
                    <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
                  </Link>
                </div>
              </div>
            </li>
          )
        )}
      </ul>

      {!loading && sites.length === 0 ? (
        <button
          type="button"
          className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:border-white/15 dark:hover:border-white/25 dark:focus:outline-indigo-500"
        >
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="mx-auto size-12 text-gray-400 dark:text-gray-500"
          >
            <path
              d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">
            No sites available
          </span>
        </button>
      ) : null}
    </div>
  );
}
