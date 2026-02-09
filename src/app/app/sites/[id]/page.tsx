"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
};

type SiteReport = {
  id: string;
  project: string;
  site: string;
  createdAt: string;
  status: "Reviewing" | "Completed" | "In progress";
  inspector: string;
  trade: string;
  issues: { id: string; title: string; severity: "Low" | "Medium" | "High" | "Critical" }[];
};

export default function SiteDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [site, setSite] = useState<Site | null>(null);
  const [reports, setReports] = useState<SiteReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const [siteRes, reportsRes] = await Promise.all([
          fetch(`/api/sites/${id}`),
          fetch(`/api/sites/${id}/reports`),
        ]);

        if (!isMounted) return;

        if (!siteRes.ok) {
          setSite(null);
          setReports([]);
          return;
        }

        const siteData = await siteRes.json();
        const reportData = reportsRes.ok ? await reportsRes.json() : { items: [] };

        setSite(siteData?.item ?? null);
        setReports(Array.isArray(reportData) ? reportData : reportData?.items ?? []);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const siteStatusBadge = useMemo(
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

  const reportStatusBadge = useMemo(
    () => (status: SiteReport["status"]) =>
      classNames(
        status === "Completed"
          ? "bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400"
          : status === "Reviewing"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/10 dark:text-yellow-300",
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
      ),
    []
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-56 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        <div className="h-48 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Site not found.</p>
        <Link
          href="/app/sites"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          Back to sites
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{site.project}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{site.siteName}</p>
        </div>
        <Link
          href="/app/sites"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
        >
          Back to sites
        </Link>
      </div>

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800/50 dark:shadow-none dark:inset-ring dark:inset-ring-white/10">
        <div className="px-4 py-6 sm:px-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Site profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
            Current operational context and ownership.
          </p>
        </div>
        <div className="border-t border-gray-100 dark:border-white/5">
          <dl className="divide-y divide-gray-100 dark:divide-white/5">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">Status</dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                <span className={siteStatusBadge(site.status)}>{site.status}</span>
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">Site manager</dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">{site.manager}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">Region</dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">{site.region}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">Phase</dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">{site.phase}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">Description</dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">{site.description}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">Risk pressure</dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                {site.openRisks} open risks, {site.highRiskCount} high-severity
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">Last report date</dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">{site.lastReportDate}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent reports</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Latest inspections linked to this site.
          </p>
        </div>
        <div className="px-4 pb-5 sm:px-6">
          {reports.length === 0 ? (
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
                No reports for this site
              </span>
            </button>
          ) : (
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
                  <thead>
                    <tr>
                      <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0 dark:text-white">
                        Report
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Inspector
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Trade
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Date
                      </th>
                      <th className="py-3.5 pr-4 pl-3 text-right text-sm font-semibold sm:pr-0">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0 dark:text-white">
                          {report.id}
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          <span className={reportStatusBadge(report.status)}>{report.status}</span>
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {report.inspector}
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {report.trade}
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {report.createdAt}
                        </td>
                        <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                          <Link
                            href={`/app/reports/${report.id}`}
                            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
