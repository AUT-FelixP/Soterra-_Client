import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";

export function SectionFrame({ title, subtitle, children, className }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-[#24272d] dark:bg-[#111316] dark:shadow-none ${className || ""}`}>
      <header className="border-b border-slate-200 px-4 py-3 dark:border-[#24272d]">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[960px] table-fixed border-collapse text-left text-sm leading-5">{children}</table></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold leading-5 text-slate-700 dark:border-[#24272d] dark:bg-[#0d0f12] dark:text-slate-200">{children}</th>;
}

function Td({ children, strong, title }: { children: React.ReactNode; strong?: boolean; title?: string }) {
  return <td title={title} className={`border-b border-slate-100 px-3 py-3.5 align-top text-slate-600 dark:border-[#202329] dark:text-slate-300 ${strong ? "font-semibold text-slate-950 dark:text-white" : ""}`}>{children}</td>;
}

function Tone({ value }: { value: string }) {
  const style = value === "Critical"
    ? "bg-red-500/12 text-red-700 dark:text-red-300"
    : value === "High" || value === "Needs review"
      ? "bg-amber-500/12 text-amber-800 dark:text-amber-300"
      : value === "Medium"
        ? "bg-yellow-500/12 text-yellow-800 dark:text-yellow-200"
        : "bg-blue-500/12 text-blue-700 dark:text-blue-300";
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold leading-4 ${style}`}>{value}</span>;
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
      <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5 dark:divide-[#24272d]">
        <div className="flex min-h-20 items-center justify-between gap-3 p-4 sm:block">
          <span className="text-sm leading-5 text-slate-500">Overall health</span>
          <div className="sm:mt-2"><Tone value={quality.health} /></div>
        </div>
        {metrics.map(([label, metric]) => (
          <div key={label} className="min-h-20 p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm leading-5">
              <span>{label}</span>
              <strong className="whitespace-nowrap">{metric.count} · {metric.percent}%</strong>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10">
              <div className={`h-full rounded-full ${metric.percent >= 20 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${Math.min(metric.percent, 100)}%` }} />
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
  const issuesByTitle = Map.groupBy(issues, (issue) => issue.issue);
  const rows = risks.map((risk) => {
    const matching = issuesByTitle.get(risk.issue) ?? [];
    return {
      risk,
      summary: matching[0]?.summary,
      locations: uniqueValues(matching.map((issue) => issue.location || "Location not stated")),
      projectSites: uniqueValues(matching.map((issue) => [issue.project, issue.site && issue.site !== issue.project ? issue.site : ""].filter(Boolean).join(" / ") || "—")),
      inspectionTrades: uniqueValues(matching.map((issue) => [issue.inspectionType, issue.trade].filter(Boolean).join(" / ") || "—")),
      statuses: uniqueValues(matching.map((issue) => issue.status).filter(Boolean)),
      reports: uniqueValues(matching.map((issue) => reportNames[issue.reportId] || issue.reportId)),
    };
  });

  return (
    <SectionFrame title="Issues to fix" subtitle="Start with the highest-priority items. Use the location, trade and source report to find and fix each issue on site.">
      <div className="hidden lg:block">
        <Table>
          <colgroup><col className="w-[26%]" /><col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[9%]" /><col className="w-[6%]" /><col className="w-[9%]" /></colgroup>
          <thead><tr>{["Issue", "Location", "Project / site", "Inspection / trade", "Status", "Repeats", "Priority"].map((label) => <Th key={label}>{label}</Th>)}</tr></thead>
          <tbody>{rows.map(({ risk, summary, locations, projectSites, inspectionTrades, statuses, reports }) => (
            <tr key={risk.issue} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.025]">
              <Td strong title={summary}>
                <span className="block text-base leading-6">{risk.issue}</span>
                <span className="mt-1.5 block text-xs font-normal leading-4 text-slate-500"><ValueList values={reports} /></span>
              </Td>
              <Td><ValueList values={locations} /></Td>
              <Td><ValueList values={projectSites} /></Td>
              <Td><ValueList values={inspectionTrades} /></Td>
              <Td><ValueList values={statuses} /></Td>
              <Td>{risk.repeatCount}</Td>
              <Td><Tone value={risk.riskLevel} /><small className="mt-1.5 block leading-4 text-slate-500">{risk.riskScore}/100 · {risk.highestSeverity} severity</small></Td>
            </tr>
          ))}</tbody>
        </Table>
      </div>

      <div className="divide-y divide-slate-200 lg:hidden dark:divide-[#24272d]">
        {rows.map(({ risk, summary, locations, projectSites, inspectionTrades, statuses, reports }) => (
          <article key={risk.issue} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <h3 title={summary} className="text-base font-semibold leading-6 text-slate-950 dark:text-white">{risk.issue}</h3>
              <Tone value={risk.riskLevel} />
            </div>
            <p className="mt-2 text-sm font-medium leading-5 text-blue-700 dark:text-blue-300"><ValueList values={locations} /></p>
            <dl className="mt-4 grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
              <MobileDetail label="Project / site"><ValueList values={projectSites} /></MobileDetail>
              <MobileDetail label="Inspection / trade"><ValueList values={inspectionTrades} /></MobileDetail>
              <MobileDetail label="Status"><ValueList values={statuses} /></MobileDetail>
              <MobileDetail label="Priority">{risk.riskScore}/100 · {risk.highestSeverity} severity · {risk.repeatCount} repeat{risk.repeatCount === 1 ? "" : "s"}</MobileDetail>
              <MobileDetail label="Source report" wide><ValueList values={reports} /></MobileDetail>
            </dl>
          </article>
        ))}
      </div>
    </SectionFrame>
  );
}

function MobileDetail({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 leading-5 text-slate-700 dark:text-slate-200">{children}</dd></div>;
}

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

function ValueList({ values }: { values: string[] }) {
  if (values.length === 0) return <>—</>;
  const visible = values.slice(0, 2);
  return (
    <span title={values.join(", ")}>
      {visible.map((value) => <span key={value} className="block break-words">{value}</span>)}
      {values.length > visible.length ? <small className="mt-0.5 block text-slate-500">+{values.length - visible.length} more</small> : null}
    </span>
  );
}
