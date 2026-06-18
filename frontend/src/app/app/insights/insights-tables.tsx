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
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-xs">{children}</table></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:border-[#24272d] dark:bg-[#0d0f12] dark:text-slate-400">{children}</th>;
}

function Td({ children, strong, title }: { children: React.ReactNode; strong?: boolean; title?: string }) {
  return <td title={title} className={`border-b border-slate-100 px-4 py-3 align-top text-slate-600 last:whitespace-nowrap dark:border-[#202329] dark:text-slate-300 ${strong ? "max-w-xs font-medium text-slate-950 dark:text-white" : ""}`}>{children}</td>;
}

function Tone({ value }: { value: string }) {
  const style = value === "Critical"
    ? "bg-red-500/12 text-red-700 dark:text-red-300"
    : value === "High" || value === "Needs review"
      ? "bg-amber-500/12 text-amber-800 dark:text-amber-300"
      : value === "Medium"
        ? "bg-yellow-500/12 text-yellow-800 dark:text-yellow-200"
        : "bg-blue-500/12 text-blue-700 dark:text-blue-300";
  return <span className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${style}`}>{value}</span>;
}

export function RiskMatrix({ rows }: { rows: DashboardInsightsResponse["riskMatrix"] }) {
  return (
    <SectionFrame title="Risk matrix" subtitle="Top 10 issues by severity, recurrence and open findings.">
      <Table><thead><tr>{["Issue", "Highest severity", "Repeats", "Open", "Projects", "Risk score", "Risk level"].map((label) => <Th key={label}>{label}</Th>)}</tr></thead>
        <tbody>{rows.slice(0, 10).map((row) => <tr key={row.issue}><Td strong>{row.issue}</Td><Td><Tone value={row.highestSeverity} /></Td><Td>{row.repeatCount}</Td><Td>{row.openCount}</Td><Td>{row.projectCount}</Td><Td><strong>{row.riskScore}</strong> / 100</Td><Td><Tone value={row.riskLevel} /></Td></tr>)}</tbody>
      </Table>
    </SectionFrame>
  );
}

export function RepeatedPatterns({ rows }: { rows: DashboardInsightsResponse["repeatedPatterns"] }) {
  return (
    <SectionFrame title="Repeated patterns" subtitle="The issues occurring most often across selected inspections." className="xl:col-span-2">
      <Table><thead><tr><Th>Issue</Th><Th>Occurrences</Th><Th>Inspections</Th><Th>Severity</Th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.issue}><Td strong>{row.issue}</Td><Td>{row.occurrenceCount ?? row.failCount ?? 0}</Td><Td>{row.affectedInspectionCount ?? row.inspectionsAffected}</Td><Td><Tone value={row.highestSeverity ?? "Low"} /></Td></tr>)}</tbody>
      </Table>
    </SectionFrame>
  );
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
      <div className="space-y-5 p-4">
        <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Overall health</span><Tone value={quality.health} /></div>
        {metrics.map(([label, metric]) => <div key={label}><div className="mb-1.5 flex justify-between text-xs"><span>{label}</span><strong>{metric.count} · {metric.percent}%</strong></div><div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10"><div className={`h-full rounded-full ${metric.percent >= 20 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${Math.min(metric.percent, 100)}%` }} /></div></div>)}
      </div>
    </SectionFrame>
  );
}

export function IssueDrilldown({ rows }: { rows: DashboardInsightsResponse["issueDrilldown"] }) {
  return (
    <SectionFrame title="Issue drill-down" subtitle={`${rows.length} underlying findings behind the visuals`}>
      <Table><thead><tr>{["Issue", "Project / site", "Location", "Inspection / trade", "Category", "Severity", "Status", "Confidence", "Created", "Report"].map((label) => <Th key={label}>{label}</Th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}><Td strong title={row.summary}>{row.issue}</Td><Td>{row.project || "—"}<small className="block text-slate-500">{row.site && row.site !== row.project ? row.site : ""}</small></Td><Td>{row.location || "Not stated"}</Td><Td>{row.inspectionType || "—"}<small className="block text-slate-500">{row.trade || ""}</small></Td><Td>{row.category || "—"}</Td><Td><Tone value={row.severity} /></Td><Td>{row.status}</Td><Td>{row.confidence == null ? "—" : `${Math.round(row.confidence * 100)}%`}</Td><Td>{formatDate(row.createdAt)}</Td><Td>{row.reportId}</Td></tr>)}</tbody>
      </Table>
    </SectionFrame>
  );
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value.slice(0, 10)
    : date.toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
}
