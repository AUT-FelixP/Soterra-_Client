"use client";

import { useEffect, useMemo, useState } from "react";
import { classNames } from "@/lib/classNames";

type SiteOption = {
  id: string;
  project: string;
  siteName: string;
};

type SummaryStat = {
  name: string;
  value: string;
  unit?: string;
};

type TopIssue = {
  title: string;
  occurrences: number;
  highestSeverity: "Low" | "Medium" | "High" | "Critical";
  lastSeen: string;
  affectedSites: number;
};

type InsightsResponse = {
  summary: SummaryStat[];
  topIssues: TopIssue[];
  trend: {
    siteId: string;
    siteName: string | null;
    from: string;
    to: string;
    series: {
      issueCount: {
        name: string;
        unit: string;
        points: { label: string; date: string; value: number }[];
      };
      highRiskCount: {
        name: string;
        unit: string;
        points: { label: string; date: string; value: number }[];
      };
      completionRate: {
        name: string;
        unit: string;
        points: { label: string; date: string; value: number }[];
      };
    };
  };
};

export default function InsightsPage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [filters, setFilters] = useState({
    siteId: "",
    from: "",
    to: "",
  });
  const [summary, setSummary] = useState<SummaryStat[]>([]);
  const [topIssues, setTopIssues] = useState<TopIssue[]>([]);
  const [trend, setTrend] = useState<InsightsResponse["trend"]>({
    siteId: "",
    siteName: null,
    from: "",
    to: "",
    series: {
      issueCount: { name: "Issue count", unit: "issues", points: [] },
      highRiskCount: { name: "High-risk count", unit: "issues", points: [] },
      completionRate: { name: "Completion rate", unit: "%", points: [] },
    },
  });
  const [activeTrend, setActiveTrend] = useState<
    "issueCount" | "highRiskCount" | "completionRate"
  >("issueCount");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSites() {
      const response = await fetch("/api/sites");
      const data = await response.json();
      if (!isMounted) return;
      setSites(Array.isArray(data) ? data : data?.items ?? []);
    }

    loadSites();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInsights() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.siteId) params.set("siteId", filters.siteId);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);

        const query = params.toString();
        const response = await fetch(
          `/api/insights${query ? `?${query}` : ""}`
        );
        const data = (await response.json()) as InsightsResponse;
        if (!isMounted) return;
        setSummary(data?.summary ?? []);
        setTopIssues(data?.topIssues ?? []);
        setTrend(
          data?.trend ?? {
            siteId: "",
            siteName: null,
            from: "",
            to: "",
            series: {
              issueCount: {
                name: "Issue count",
                unit: "issues",
                points: [],
              },
              highRiskCount: {
                name: "High-risk count",
                unit: "issues",
                points: [],
              },
              completionRate: {
                name: "Completion rate",
                unit: "%",
                points: [],
              },
            },
          }
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInsights();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  const severityBadge = useMemo(
    () => (severity: TopIssue["highestSeverity"]) =>
      classNames(
        severity === "Critical"
          ? "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400"
          : severity === "High"
            ? "bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300"
            : severity === "Medium"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-400/10 dark:text-yellow-300"
              : "bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400",
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
      ),
    []
  );

  const activeSeries = trend.series[activeTrend];
  const latestPoint = activeSeries.points.at(-1) ?? null;
  const previousPoint =
    activeSeries.points.length > 1
      ? activeSeries.points[activeSeries.points.length - 2]
      : null;
  const deltaValue = latestPoint && previousPoint
    ? Number((latestPoint.value - previousPoint.value).toFixed(1))
    : null;

  const maxPointValue = Math.max(
    1,
    ...activeSeries.points.map((point) => point.value)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Insights
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Mock analytics from report history and recurring issue patterns.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Filters
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Site
              </label>
              <select
                value={filters.siteId}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, siteId: event.target.value }))
                }
                className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-900 dark:*:text-white dark:focus:outline-indigo-500"
              >
                <option value="">All sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.project} ({site.siteName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                From
              </label>
              <input
                type="date"
                value={filters.from}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, from: event.target.value }))
                }
                className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                To
              </label>
              <input
                type="date"
                value={filters.to}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, to: event.target.value }))
                }
                className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4 dark:bg-white/10">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`insight-stat-${index}`}
                  className="bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-gray-900"
                >
                  <>
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    <div className="mt-3 h-10 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                  </>
                </div>
              ))
            : summary.map((stat) => (
                <div
                  key={stat.name}
                  className="bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-gray-900"
                >
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="mt-2 flex items-baseline gap-x-2">
                    <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                    {stat.unit ? (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.unit}
                      </span>
                    ) : null}
                  </p>
                </div>
              ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Top recurring issues
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Ranked by repeated occurrence in the selected filters.
          </p>
        </div>
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm outline-1 outline-black/5 sm:rounded-lg dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
              <table className="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
                <thead className="bg-gray-50 dark:bg-gray-800/75">
                  <tr>
                    <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6 dark:text-gray-200">
                      Issue
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Recurrence
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Highest severity
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Affected sites
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Last seen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-800/50">
                  {loading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <tr key={`insight-row-${index}`}>
                          <td className="py-4 pr-3 pl-4 sm:pl-6">
                            <div className="h-4 w-64 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-4 w-16 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                          </td>
                        </tr>
                      ))
                    : topIssues.map((issue) => (
                        <tr key={issue.title}>
                          <td className="py-4 pr-3 pl-4 text-sm font-medium text-gray-900 sm:pl-6 dark:text-white">
                            {issue.title}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {issue.occurrences}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span className={severityBadge(issue.highestSeverity)}>
                              {issue.highestSeverity}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {issue.affectedSites}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {issue.lastSeen}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {!loading && topIssues.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                No recurring issues found for the selected filters.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Trend
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Filter-aware daily metric history from reports in scope.
          </p>
          <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 dark:border-white/15 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Scope:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {trend.siteName ?? "All sites"}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Date range:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {trend.from || "Start"} to {trend.to || "Today"}
              </span>
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(
                [
                  ["issueCount", trend.series.issueCount.name],
                  ["highRiskCount", trend.series.highRiskCount.name],
                  ["completionRate", trend.series.completionRate.name],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTrend(key)}
                  className={classNames(
                    activeTrend === key
                      ? "bg-indigo-100 text-indigo-700 inset-ring-indigo-300 dark:bg-indigo-400/10 dark:text-indigo-300 dark:inset-ring-indigo-400/30"
                      : "bg-white text-gray-500 inset-ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:inset-ring-white/10",
                    "rounded-md p-3 text-left text-xs shadow-xs inset-ring"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-md bg-white/70 p-4 inset-ring inset-ring-gray-200 dark:bg-white/5 dark:inset-ring-white/10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activeSeries.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Unit: {activeSeries.unit}
                  </p>
                </div>
                {latestPoint ? (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Latest ({latestPoint.label})
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {latestPoint.value}
                      {activeSeries.unit === "%" ? "%" : ""}
                    </p>
                    {deltaValue !== null ? (
                      <p
                        className={classNames(
                          deltaValue > 0
                            ? "text-rose-600 dark:text-rose-300"
                            : deltaValue < 0
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-gray-500 dark:text-gray-400",
                          "text-xs"
                        )}
                      >
                        {deltaValue > 0 ? "+" : ""}
                        {deltaValue}
                        {activeSeries.unit === "%" ? "%" : ""} vs previous day
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {activeSeries.points.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  No trend data available for this filter range.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {activeSeries.points.map((point) => (
                    <li key={`${activeTrend}-${point.date}`}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300">
                          {point.label}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {point.value}
                          {activeSeries.unit === "%" ? "%" : ""}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10">
                        <div
                          className="h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"
                          style={{
                            width: `${
                              activeSeries.unit === "%"
                                ? Math.max(0, Math.min(100, point.value))
                                : Math.max(0, (point.value / maxPointValue) * 100)
                            }%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
