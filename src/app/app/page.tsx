"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Kpi = { name: string; value: string; unit?: string };
type Report = {
  id: string;
  project: string;
  site: string;
  createdAt: string;
  status: string;
  issues: Array<{
    id: string;
    title: string;
    severity: "Low" | "Medium" | "High" | "Critical";
  }>;
};
type TopIssue = {
  title: string;
  occurrences: number;
  highestSeverity: "Low" | "Medium" | "High" | "Critical";
};
type ReinspectionBreakdown = {
  count: number;
  percentage: number;
};
type TrackerIssue = {
  id: string;
  reinspections: number;
  status: "Open" | "Closed";
};

export default function OverviewPage() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [topIssues, setTopIssues] = useState<TopIssue[]>([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [trackerIssues, setTrackerIssues] = useState<TrackerIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const [kpiRes, reportRes, insightsRes, trackerRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/reports?limit=5"),
          fetch("/api/insights"),
          fetch("/api/issues"),
        ]);
        const [kpiData, reportData, insightsData, trackerData] = await Promise.all([
          kpiRes.json(),
          reportRes.json(),
          insightsRes.json(),
          trackerRes.json(),
        ]);

        if (!isMounted) return;
        setKpis(Array.isArray(kpiData) ? kpiData : kpiData?.items ?? []);
        setReports(
          Array.isArray(reportData) ? reportData : reportData?.items ?? []
        );
        setTopIssues(
          Array.isArray(insightsData?.topIssues) ? insightsData.topIssues : []
        );
        setTotalIssues(
          typeof insightsData?.totalIssues === "number" ? insightsData.totalIssues : 0
        );
        setTrackerIssues(
          Array.isArray(trackerData) ? trackerData : trackerData?.items ?? []
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasReports = reports.length > 0;
  const hasKpis = kpis.length > 0;
  const hasTopIssues = topIssues.length > 0;
  const openIssues = trackerIssues.filter((issue) => issue.status === "Open").length;
  const kpiCards: Array<Kpi | null> = loading
    ? Array.from({ length: 3 }, () => null)
    : kpis;
  const reinspectionAnalysis = getReinspectionAnalysis(trackerIssues);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Performance overview across uploaded inspection categories.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <div className="grid grid-cols-1 gap-px bg-gray-200/70 sm:grid-cols-3 dark:bg-white/10">
          {kpiCards.map((stat, index) => (
            <div
              key={stat?.name ?? `kpi-${index}`}
              className="bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-gray-900"
            >
              {stat === null ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-28 rounded bg-gray-200 dark:bg-white/10" />
                  <div className="h-8 w-32 rounded bg-gray-200 dark:bg-white/10" />
                </div>
              ) : (
                <>
                  <p className="text-sm/6 font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="mt-2 flex items-baseline gap-x-2">
                    <span className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                    {stat.unit ? (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.unit}
                      </span>
                    ) : null}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        {!loading && !hasKpis ? (
          <div className="border-t border-gray-200 px-6 py-10 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
            No KPI data available yet.
          </div>
        ) : null}
      </section>

      <Link
        href="/app/tracker"
        className="block rounded-xl bg-linear-to-r from-indigo-600 to-cyan-500 p-[1px] shadow-sm transition hover:shadow-md dark:shadow-none"
      >
        <div className="rounded-[calc(0.75rem-1px)] bg-white px-6 py-5 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Live Tracker
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                Open issues: {loading ? "..." : openIssues}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review outstanding inspection items and update their status.
              </p>
            </div>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
              Open tracker
            </span>
          </div>
        </div>
      </Link>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Top Failure Types
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Most common issue patterns found across recent inspections.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Failure type</th>
                  <th className="px-6 py-3">Occurrences</th>
                  <th className="px-6 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <tr key={`top-issue-skeleton-${index}`}>
                        <td className="px-6 py-4">
                          <div className="h-4 w-56 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : topIssues.map((issue) => (
                      <tr key={issue.title}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {issue.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {issue.occurrences}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatPercentage(issue.occurrences, totalIssues)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && !hasTopIssues ? (
            <div className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
              No failure patterns available yet.
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Re-inspection Analysis
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Distribution of issues by how many follow-up inspections they needed.
            </p>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`reinspection-skeleton-${index}`}
                    className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse"
                  />
                ))}
              </div>
            ) : reinspectionAnalysis.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No re-inspection data available yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {reinspectionAnalysis.map((item) => (
                  <li
                    key={item.count}
                    className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.count} re-inspection{item.count === 1 ? "" : "s"}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.percentage}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div>
        <section className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Latest Inspections
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Most recent uploads across all inspection categories.
              </p>
            </div>
            <Link
              href="/app/reports"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Inspection</th>
                  <th className="px-6 py-3">Site</th>
                  <th className="px-6 py-3">Failed items</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`report-skeleton-${index}`}>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-12 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : reports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {report.project}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {report.site}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {report.issues.length}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                            {report.status}
                          </span>
                        </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                      </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && !hasReports ? (
            <div className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
              No inspection uploads yet.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function formatPercentage(part: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((part / total) * 100)}%`;
}

function getReinspectionAnalysis(issues: TrackerIssue[]): ReinspectionBreakdown[] {
  if (issues.length === 0) {
    return [];
  }

  const counts = new Map<number, number>();

  for (const issue of issues) {
    counts.set(issue.reinspections, (counts.get(issue.reinspections) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([count, issueCount]) => ({
      count,
      percentage: Math.round((issueCount / issues.length) * 100),
    }));
}

