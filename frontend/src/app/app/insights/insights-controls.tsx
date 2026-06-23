"use client";

import { useMemo } from "react";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import { DATE_LABELS, DEFAULT_INSIGHT_FILTERS, type InsightFilters } from "./insights-types";

type IssueRow = DashboardInsightsResponse["issueDrilldown"][number];
type SelectOption = { label: string; value: string };

const LOCATION_FILTER_DEFAULTS = {
  report_id: DEFAULT_INSIGHT_FILTERS.report_id,
  location: DEFAULT_INSIGHT_FILTERS.location,
} as const;

function uniqueValues(rows: IssueRow[], getValue: (row: IssueRow) => string | undefined) {
  return [...new Set(rows.map(getValue).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

function withCurrentValue(defaultValue: string, values: string[], currentValue: string) {
  return [defaultValue, ...new Set(currentValue === defaultValue ? values : [currentValue, ...values])];
}

function toOptions(values: string[], getLabel: (value: string) => string = (value) => value): SelectOption[] {
  return values.map((value) => ({ label: getLabel(value), value }));
}

export function InsightsFilterBar({ filters, options, issues, reportNames, onChange, onReset }: {
  filters: InsightFilters;
  options: DashboardInsightsResponse["filters"];
  issues: DashboardInsightsResponse["issueDrilldown"];
  reportNames: Record<string, string>;
  onChange: (key: keyof InsightFilters, value: string) => void;
  onReset: () => void;
}) {
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value !== DEFAULT_INSIGHT_FILTERS[key as keyof InsightFilters]
  );
  const reportOptions = useMemo(
    () => uniqueValues(
      issues.filter((issue) => filters.project === DEFAULT_INSIGHT_FILTERS.project || issue.project === filters.project),
      (issue) => issue.reportId
    ),
    [filters.project, issues]
  );
  const locationOptions = useMemo(
    () => uniqueValues(
      issues.filter((issue) => filters.report_id === LOCATION_FILTER_DEFAULTS.report_id || issue.reportId === filters.report_id),
      (issue) => issue.location
    ),
    [filters.report_id, issues]
  );
  const fields: Array<{ key: keyof InsightFilters; label: string; options: SelectOption[] }> = [
    { key: "project", label: "Project", options: toOptions(options.projects) },
    { key: "site", label: "Site", options: toOptions(options.sites) },
    {
      key: "report_id",
      label: "Report",
      options: toOptions(
        withCurrentValue(LOCATION_FILTER_DEFAULTS.report_id, reportOptions, filters.report_id),
        (value) => value === LOCATION_FILTER_DEFAULTS.report_id ? value : reportNames[value] || value
      ),
    },
    { key: "trade", label: "Trade", options: toOptions(options.trades) },
    {
      key: "location",
      label: "Issue location",
      options: toOptions(withCurrentValue(LOCATION_FILTER_DEFAULTS.location, locationOptions, filters.location)),
    },
    { key: "inspection_type", label: "Inspection type", options: toOptions(options.inspectionTypes) },
    { key: "severity", label: "Severity", options: toOptions(options.severities) },
    { key: "status", label: "Status", options: toOptions(options.statuses) },
    { key: "date_range", label: "Date range", options: toOptions(options.dateRanges, (value) => DATE_LABELS[value] || value) },
  ];
  const primaryFields = fields.slice(0, 5);
  const extraFields = fields.slice(5);
  const activeFilters = fields.filter((field) => filters[field.key] !== DEFAULT_INSIGHT_FILTERS[field.key]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none" aria-label="Insight filters">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1.35fr)_auto]">
        {primaryFields.map((field) => (
          <FilterField key={field.key} field={field} value={filters[field.key]} onChange={onChange} />
        ))}
        <button type="button" disabled={!hasActiveFilters} onClick={onReset} className="h-9 self-end rounded-lg border border-slate-300 px-3 text-sm font-semibold leading-5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Reset filters</button>
      </div>

      {activeFilters.length ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
          {activeFilters.map((field) => {
            const label = field.options.find((option) => option.value === filters[field.key])?.label ?? filters[field.key];
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => onChange(field.key, DEFAULT_INSIGHT_FILTERS[field.key])}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold leading-4 text-indigo-800 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                title={`Remove ${field.label} filter`}
              >
                <span className="truncate">{field.label}: {label}</span>
                <span aria-hidden="true">x</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <details className="mt-3 group">
        <summary className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold leading-5 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
          <span>More filters</span>
          <span className="text-xs font-medium text-slate-500 group-open:hidden">{extraFields.length} hidden</span>
          <span className="hidden text-xs font-medium text-slate-500 group-open:inline">Hide</span>
        </summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {extraFields.map((field) => (
            <FilterField key={field.key} field={field} value={filters[field.key]} onChange={onChange} />
          ))}
        </div>
      </details>
    </section>
  );
}

function FilterField({ field, value, onChange }: {
  field: { key: keyof InsightFilters; label: string; options: SelectOption[] };
  value: string;
  onChange: (key: keyof InsightFilters, value: string) => void;
}) {
  return (
    <label className="min-w-0 text-xs font-semibold leading-4 text-slate-500 dark:text-slate-400">
      {field.label}
      <span className="relative mt-1 block min-w-0">
        <select
          value={value}
          title={field.options.find((option) => option.value === value)?.label}
          onChange={(event) => onChange(field.key, event.target.value)}
          className="block h-9 w-full appearance-none truncate rounded-lg border border-slate-300 bg-white py-0 pl-2 pr-8 text-sm font-medium leading-5 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-300">
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

export function KpiStrip({ kpis }: { kpis: DashboardInsightsResponse["kpis"] }) {
  const visibleKpis = kpis
    .map((kpi) => {
      if (kpi.key === "open") return { ...kpi, label: "Open issues" };
      if (kpi.key === "highRisk") return { ...kpi, label: "High-priority issues" };
      if (kpi.key === "repeatRate") return { ...kpi, label: "Repeated findings" };
      return kpi;
    })
    .filter((kpi) => ["inspections", "issues", "open", "highRisk"].includes(kpi.key))
    .slice(0, 4);

  return (
    <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none" aria-label="Key metrics">
      {visibleKpis.map((kpi) => (
        <article key={kpi.key} className="border-b border-slate-200 px-4 py-4 last:border-b-0 sm:border-r xl:border-b-0 dark:border-white/10">
          <p className="text-xs font-medium leading-4 text-slate-500 dark:text-slate-400">{kpi.label}</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{kpi.value.toLocaleString()}{kpi.suffix}</p>
          {kpi.key === "repeatRate" ? <p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">Share of selected findings that repeat.</p> : null}
        </article>
      ))}
    </section>
  );
}
