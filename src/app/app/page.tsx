"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { classNames } from "@/lib/classNames";

type Kpi = { name: string; value: string; unit?: string };
type Report = {
  id: string;
  project: string;
  site: string;
  createdAt: string;
  status: string;
};
type Risk = {
  id: string;
  title: string;
  site: string;
  severity: string;
  createdAt: string;
};

export default function OverviewPage() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const [kpiRes, reportRes, riskRes] = await Promise.all([
          fetch("/api/kpis"),
          fetch("/api/reports?limit=5"),
          fetch("/api/risks?status=high&limit=5"),
        ]);
        const [kpiData, reportData, riskData] = await Promise.all([
          kpiRes.json(),
          reportRes.json(),
          riskRes.json(),
        ]);

        if (!isMounted) return;
        setKpis(Array.isArray(kpiData) ? kpiData : kpiData?.items ?? []);
        setReports(
          Array.isArray(reportData) ? reportData : reportData?.items ?? []
        );
        setRisks(Array.isArray(riskData) ? riskData : riskData?.items ?? []);
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
  const hasRisks = risks.length > 0;
  const hasKpis = kpis.length > 0;

  const riskBadgeClass = useMemo(
    () => (severity: string) =>
      classNames(
        severity === "Critical"
          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      ),
    []
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Overview
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Snapshot of inspection performance and portfolio risk.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <div className="grid grid-cols-1 gap-px bg-gray-200/70 sm:grid-cols-2 lg:grid-cols-4 dark:bg-white/10">
          {(loading ? Array.from({ length: 4 }) : kpis).map((stat, index) => (
            <div
              key={loading ? `kpi-${index}` : stat.name}
              className="bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-gray-900"
            >
              {loading ? (
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

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Recent Reports
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Latest inspection reports across active sites.
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
                  <th className="px-6 py-3">Report</th>
                  <th className="px-6 py-3">Site</th>
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
              No recent reports yet.
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Risk Alerts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              High severity issues flagged in the last 7 days.
            </p>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-white/10">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <li key={`risk-skeleton-${index}`} className="px-6 py-5">
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/10" />
                      <div className="h-4 w-48 rounded bg-gray-200 dark:bg-white/10" />
                    </div>
                  </li>
                ))
              : risks.map((risk) => (
                  <li key={risk.id} className="px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {risk.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {risk.site}
                        </p>
                      </div>
                      <span className={riskBadgeClass(risk.severity)}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {risk.createdAt}
                    </p>
                  </li>
                ))}
          </ul>

          {!loading && !hasRisks ? (
            <div className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
              No high risk alerts found.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
