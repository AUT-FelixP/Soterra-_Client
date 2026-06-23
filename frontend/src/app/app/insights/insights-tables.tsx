"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";

type RiskRow = DashboardInsightsResponse["riskMatrix"][number];
type SortMode = "priority" | "location" | "trade";
type ReportRef = { id: string; name: string };

export function SectionFrame({ title, subtitle, children, className }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none ${className || ""}`}>
      <header className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Table({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[1280px] table-fixed border-collapse text-left text-sm leading-5">{children}</table></div>;
}

function Th({ children }: { children: ReactNode }) {
  return <th className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase leading-5 tracking-[0.08em] text-slate-600 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-300">{children}</th>;
}

function Td({ children, strong, title }: { children: ReactNode; strong?: boolean; title?: string }) {
  return <td title={title} className={`border-b border-slate-100 px-3 py-4 align-top text-slate-600 dark:border-white/[0.07] dark:text-slate-300 ${strong ? "font-semibold text-slate-950 dark:text-white" : ""}`}>{children}</td>;
}

function Tone({ value }: { value: string }) {
  const style = value === "Critical"
    ? "bg-red-500/12 text-red-700 dark:text-red-300"
    : value === "High" || value === "Needs review"
      ? "bg-amber-500/12 text-amber-800 dark:text-amber-300"
      : value === "Medium"
        ? "bg-yellow-500/12 text-yellow-800 dark:text-yellow-200"
        : "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ${style}`}>{value}</span>;
}

export function DataQuality({ quality }: { quality: DashboardInsightsResponse["dataQuality"] }) {
  const metrics = [
    ["Missing location", quality.missingLocation],
    ["Missing trade", quality.missingTrade],
    ["Low confidence", quality.lowConfidence],
    ["Missing evidence", quality.missingEvidence],
  ] as const;

  return (
    <SectionFrame title="Data quality" subtitle={`${quality.totalRows} selected rows`}>
      <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5 dark:divide-white/10">
        <div className="flex min-h-20 items-center justify-between gap-3 p-4 sm:block">
          <span className="text-sm leading-5 text-slate-500">Overall health</span>
          <div className="sm:mt-2"><Tone value={quality.health} /></div>
        </div>
        {metrics.map(([label, metric]) => (
          <div key={label} className="min-h-20 p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm leading-5">
              <span>{label}</span>
              <strong className="whitespace-nowrap">{metric.count} | {metric.percent}%</strong>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10">
              <div className={`h-full rounded-full ${metric.percent >= 20 ? "bg-amber-500" : "bg-indigo-500"}`} style={{ width: `${Math.min(metric.percent, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

export function IssuePriorityTable({ issues, risks, reportNames }: {
  issues: DashboardInsightsResponse["issueDrilldown"];
  risks: DashboardInsightsResponse["riskMatrix"];
  reportNames: Record<string, string>;
}) {
  const [sortBy, setSortBy] = useState<SortMode>("priority");
  const rows = useMemo(() => {
    const issuesByTitle = Map.groupBy(issues, (issue) => issue.issue);
    const prepared = risks.map((risk) => {
      const matching = issuesByTitle.get(risk.issue) ?? [];
      return {
        risk,
        summary: matching[0]?.summary,
        requiredFixes: uniqueValues(matching.map((issue) => issue.requiredFix || issue.summary || "Fix this finding before close-out.")),
        locations: uniqueValues(matching.map((issue) => issue.location || "Location not stated")),
        projectSites: uniqueValues(matching.map((issue) => [issue.project, issue.site && issue.site !== issue.project ? issue.site : ""].filter(Boolean).join(" / ") || "-")),
        inspectionTrades: uniqueValues(matching.map((issue) => [issue.inspectionType, issue.trade].filter(Boolean).join(" / ") || "-")),
        trades: uniqueValues(matching.map((issue) => issue.trade || "Unassigned")),
        statuses: uniqueValues(matching.map((issue) => issue.status).filter(Boolean)),
        reports: uniqueReportRefs(matching.map((issue) => ({
          id: issue.reportId,
          name: reportNames[issue.reportId] || issue.reportId,
        }))),
      };
    });

    return prepared.sort((a, b) => {
      if (sortBy === "location") return firstValue(a.locations).localeCompare(firstValue(b.locations)) || comparePriority(a.risk, b.risk);
      if (sortBy === "trade") return firstValue(a.trades).localeCompare(firstValue(b.trades)) || firstValue(a.locations).localeCompare(firstValue(b.locations)) || comparePriority(a.risk, b.risk);
      return comparePriority(a.risk, b.risk) || firstValue(a.locations).localeCompare(firstValue(b.locations));
    });
  }, [issues, reportNames, risks, sortBy]);

  return (
    <SectionFrame title="Issues to fix" subtitle="Start with the highest-priority items. Use the location, trade and source report to find and fix each issue on site.">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm dark:border-white/10">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Sort by</span>
        {[
          ["priority", "Priority"],
          ["location", "Location"],
          ["trade", "Trade"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSortBy(value as SortMode)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold leading-5 transition ${sortBy === value ? "border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-950/20 dark:bg-indigo-500" : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="hidden 2xl:block">
        <Table>
          <colgroup>
            <col className="w-[21%]" />
            <col className="w-[24%]" />
            <col className="w-[16%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[6%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead><tr>{["Issue", "Required fix", "Location", "Project / site", "Inspection / trade", "Status", "Priority"].map((label) => <Th key={label}>{label}</Th>)}</tr></thead>
          <tbody>{rows.map(({ risk, summary, requiredFixes, locations, projectSites, inspectionTrades, statuses, reports }) => (
            <tr key={risk.issue} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.025]">
              <Td strong title={summary}>
                <span className="block text-base leading-6">{risk.issue}</span>
                <ReportLinks reports={reports} />
              </Td>
              <Td><ValueList values={requiredFixes} /></Td>
              <Td><ValueList values={locations} /></Td>
              <Td><ValueList values={projectSites} /></Td>
              <Td><ValueList values={inspectionTrades} /></Td>
              <Td><ValueList values={statuses} /></Td>
              <Td><Tone value={risk.riskLevel} /><small className="mt-1.5 block leading-4 text-slate-500">{risk.highestSeverity} severity<br />{risk.repeatCount} repeated</small></Td>
            </tr>
          ))}</tbody>
        </Table>
      </div>

      <div className="divide-y divide-slate-200 2xl:hidden dark:divide-white/10">
        {rows.map(({ risk, summary, requiredFixes, locations, projectSites, inspectionTrades, statuses, reports }) => (
          <article key={risk.issue} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <h3 title={summary} className="text-base font-semibold leading-6 text-slate-950 dark:text-white">{risk.issue}</h3>
              <Tone value={risk.riskLevel} />
            </div>
            <p className="mt-2 text-sm font-medium leading-5 text-indigo-700 dark:text-indigo-300"><ValueList values={locations} /></p>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
              <strong className="block text-xs uppercase">Required fix</strong>
              <ValueList values={requiredFixes} />
            </div>
            <dl className="mt-4 grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
              <MobileDetail label="Project / site"><ValueList values={projectSites} /></MobileDetail>
              <MobileDetail label="Inspection / trade"><ValueList values={inspectionTrades} /></MobileDetail>
              <MobileDetail label="Status"><ValueList values={statuses} /></MobileDetail>
              <MobileDetail label="Priority">{risk.highestSeverity} severity - {risk.repeatCount} repeated</MobileDetail>
              <MobileDetail label="Source report" wide><ReportLinks reports={reports} /></MobileDetail>
            </dl>
          </article>
        ))}
      </div>
    </SectionFrame>
  );
}

function MobileDetail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 leading-5 text-slate-700 dark:text-slate-200">{children}</dd></div>;
}

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

function uniqueReportRefs(values: ReportRef[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (!value.id || seen.has(value.id)) return false;
    seen.add(value.id);
    return true;
  });
}

function firstValue(values: string[]) {
  return values[0] || "";
}

function comparePriority(a: RiskRow, b: RiskRow) {
  return b.riskScore - a.riskScore || b.repeatCount - a.repeatCount || a.issue.localeCompare(b.issue);
}

function ValueList({ values }: { values: string[] }) {
  if (values.length === 0) return <>-</>;
  const visible = values.slice(0, 2);
  return (
    <span title={values.join(", ")}>
      {visible.map((value) => <span key={value} className="block break-words">{value}</span>)}
      {values.length > visible.length ? <small className="mt-0.5 block text-slate-500">+{values.length - visible.length} more</small> : null}
    </span>
  );
}

function ReportLinks({ reports }: { reports: ReportRef[] }) {
  if (!reports.length) return <span className="text-slate-500">No report linked</span>;
  const extraCount = reports.length - 1;
  return (
    <span className="mt-1.5 block text-xs font-normal leading-4">
      <Link href={`/app/reports/${reports[0].id}`} className="block break-words font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
        Open report
        <span className="sr-only"> {reports[0].name}</span>
      </Link>
      <span className="block break-words text-slate-500" title={reports.map((report) => report.name).join(", ")}>
        {reports[0].name}
      </span>
      {extraCount > 0 ? <small className="mt-0.5 block text-slate-500">+{extraCount} more report{extraCount === 1 ? "" : "s"}</small> : null}
    </span>
  );
}
