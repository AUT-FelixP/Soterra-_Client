"use client";

import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import { DATE_LABELS, DEFAULT_INSIGHT_FILTERS, type InsightFilters } from "./insights-types";

export function InsightsFilterBar({ filters, options, onChange, onReset }: {
  filters: InsightFilters;
  options: DashboardInsightsResponse["filters"];
  onChange: (key: keyof InsightFilters, value: string) => void;
  onReset: () => void;
}) {
  const fields: Array<{ key: keyof InsightFilters; label: string; values: string[] }> = [
    { key: "project", label: "Project", values: options.projects },
    { key: "site", label: "Site", values: options.sites },
    { key: "inspection_type", label: "Inspection type", values: options.inspectionTypes },
    { key: "trade", label: "Trade", values: options.trades },
    { key: "severity", label: "Severity", values: options.severities },
    { key: "status", label: "Status", values: options.statuses },
    { key: "date_range", label: "Date range", values: options.dateRanges },
  ];
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value !== DEFAULT_INSIGHT_FILTERS[key as keyof InsightFilters]
  );

  return (
    <section className="rounded-md border border-slate-200 bg-white p-3 dark:border-[#24272d] dark:bg-[#111316]" aria-label="Insight filters">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        {fields.map((field) => (
          <label key={field.key} className="min-w-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {field.label}
            <select
              value={filters[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="mt-1 block h-9 w-full rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-[#30343b] dark:bg-[#0b0d10] dark:text-slate-100"
            >
              {field.values.map((value) => (
                <option key={value} value={value}>{field.key === "date_range" ? DATE_LABELS[value] || value : value}</option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          disabled={!hasActiveFilters}
          onClick={onReset}
          className="h-9 self-end rounded border border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-[#30343b] dark:text-slate-300 dark:hover:bg-white/5"
        >
          Reset filters
        </button>
      </div>
    </section>
  );
}

export function KpiStrip({ kpis }: { kpis: DashboardInsightsResponse["kpis"] }) {
  return (
    <section className="grid overflow-hidden rounded-md border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5 dark:border-[#24272d] dark:bg-[#111316]" aria-label="Key metrics">
      {kpis.map((kpi) => (
        <article key={kpi.key} className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:border-r xl:border-b-0 dark:border-[#24272d]">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{kpi.value.toLocaleString()}{kpi.suffix}</p>
        </article>
      ))}
    </section>
  );
}
