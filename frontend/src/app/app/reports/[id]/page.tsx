import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBackendJson } from "@/lib/backendProxy";
import { ReportPrintActions } from "./ReportPrintActions";

const severityStyles = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  Medium:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  High: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/20",
  Critical:
    "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
} as const;

const statusStyles = {
  Reviewing:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  Completed:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  "In progress":
    "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
} as const;

const issueStatusStyles = {
  Open: "critical",
  Ready: "warning",
  Closed: "success",
} as const;

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await fetchBackendJson<{
    item: {
      id: string;
      project: string;
      site: string;
      address?: string | null;
      createdAt: string;
      uploadedAt?: string;
      status: "Reviewing" | "Completed" | "In progress";
      summary: string;
      inspectionType: string;
      inspector: string;
      trade: string;
      sourceFileName?: string;
      units: string[];
      issues: Array<{
        id: string;
        title: string;
        description: string;
        severity: "Low" | "Medium" | "High" | "Critical";
        status: "Open" | "Ready" | "Closed";
        category: string;
        trade: string;
        location?: string | null;
        unitLabel?: string | null;
        recurrenceRisk: number;
        reinspections: number;
      }>;
    };
  }>(`/reports/${id}`).catch(() => null);
  const report = payload?.item ?? null;

  if (!report) {
    notFound();
  }

  const issues = Array.isArray(report.issues) ? report.issues : [];
  const units = Array.isArray(report.units) ? report.units : [];
  const inspectionType = report.inspectionType || "Unknown inspection";
  const summary = report.summary || "A summary is not available for this report yet.";
  const trade = report.trade || "Unspecified";
  const inspector = report.inspector || "Not captured";

  const severityCount = issues.reduce(
    (counts, issue) => {
      counts[issue.severity] += 1;
      return counts;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  );
  const highestSeverity =
    issues.find((issue) => issue.severity === "Critical")?.severity ??
    issues.find((issue) => issue.severity === "High")?.severity ??
    issues.find((issue) => issue.severity === "Medium")?.severity ??
    issues[0]?.severity ??
    "Low";
  const reportDate = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const uploadedAt = report.uploadedAt
    ? new Date(report.uploadedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : reportDate;

  return (
    <>
      <style>{`
        @media print {
          body {
            background: white !important;
          }

          .report-print-hidden {
            display: none !important;
          }

          .report-print-shell {
            padding: 0 !important;
          }

          .report-print-card {
            box-shadow: none !important;
            outline: 1px solid rgba(15, 23, 42, 0.12) !important;
            break-inside: avoid;
          }
        }
      `}</style>
      <div className="report-print-shell space-y-8">
        <section className="report-print-card overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs/6 font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
                Report
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2rem]">
                {report.project}
              </h1>
              <p className="mt-2 max-w-2xl text-sm/6 text-slate-600 dark:text-slate-300">
                {summary}
              </p>
            </div>

            <div className="report-print-hidden flex flex-wrap items-center gap-3">
              <Link
                href="/app/reports"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm/6 font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Back to reports
              </Link>
              <ReportPrintActions reportId={report.id} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Inspection type" value={inspectionType} />
            <StatCard label="Site" value={report.site} />
            <StatCard label="Inspector" value={inspector} />
            <StatCard label="Trade" value={trade} />
          </div>
        </section>

        {report.status === "In progress" ? (
          <section className="report-print-card rounded-xl border border-sky-200 bg-sky-50 px-5 py-3.5 text-sm/6 text-sky-900 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100">
            This file is uploaded and the data extraction is in progress. Some details may update when processing completes.
          </section>
        ) : null}

        <section className="grid items-start gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="report-print-card self-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Project summary
                  </h2>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[report.status]}`}
                >
                  {report.status}
                </span>
              </div>
            </div>

            <dl className="grid gap-px bg-slate-200/70 sm:grid-cols-2 dark:bg-white/10">
              <SummaryItem label="Report ID" value={report.id} />
              <SummaryItem label="Total issues" value={String(issues.length)} />
              <SummaryItem label="Highest severity" value={highestSeverity} />
              <SummaryItem label="Critical items" value={String(severityCount.Critical)} />
            </dl>

            <div className="border-t border-slate-200 px-5 py-4 dark:border-white/10">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Severity distribution
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(severityCount).map(([severity, count]) => (
                  <div
                    key={severity}
                    className="rounded-xl bg-slate-50 px-4 py-3.5 dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${severityStyles[severity as keyof typeof severityStyles]}`}
                      >
                        {severity}
                      </span>
                      <span className="text-[1.75rem] font-semibold text-slate-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="report-print-card self-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Report details
              </h2>
              <p className="mt-1 text-sm/6 text-slate-600 dark:text-slate-400">
                Key details saved from this uploaded report.
              </p>
            </div>
            <dl className="divide-y divide-slate-200 dark:divide-white/10">
              <DetailRow label="Project" value={report.project} />
              <DetailRow label="Inspection type" value={inspectionType} />
              <DetailRow label="Site" value={report.site} />
              <DetailRow label="Address" value={report.address || "Not provided"} />
              <DetailRow label="Trade" value={trade} />
              <DetailRow label="Inspector" value={inspector} />
              <DetailRow label="Report date" value={reportDate} />
              <DetailRow label="Uploaded" value={uploadedAt} />
              <DetailRow label="Source file" value={report.sourceFileName || "Uploaded PDF"} />
              <DetailRow
                label="Units"
                value={units.length > 0 ? units.join(", ") : "No unit labels found"}
              />
            </dl>
          </div>
        </section>

        <section className="report-print-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Issue register
              </h2>
              <p className="mt-1 text-sm/6 text-slate-600 dark:text-slate-400">
                Individual issues recorded for this report.
              </p>
            </div>
            <p className="text-sm/6 text-slate-600 dark:text-slate-400">
              {issues.length} item{issues.length === 1 ? "" : "s"} identified
            </p>
          </div>

          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {issues.map((issue, index) => (
              <li key={issue.id} className="px-5 py-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                        Issue {index + 1}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {issue.title}
                      </h3>
                      <p className="mt-2 text-sm/6 text-slate-600 dark:text-slate-300">
                        {issue.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-400 dark:text-slate-500">
                        {issue.id}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${severityStyles[issue.severity]}`}
                      >
                        {issue.severity}
                      </span>
                      <IssueStatusBadge status={issue.status} />
                    </div>
                  </div>

                  <dl className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-3">
                    <IssueMeta label="Category" value={issue.category} />
                    <IssueMeta label="Trade" value={issue.trade} />
                    <IssueMeta label="Location" value={issue.location || "Not captured"} />
                    <IssueMeta label="Unit" value={issue.unitLabel || "Not captured"} />
                    <IssueMeta label="Chance of repeat issue" value={`${issue.recurrenceRisk}%`} />
                    <IssueMeta label="Follow-up inspections" value={String(issue.reinspections)} />
                  </dl>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4 dark:bg-slate-900">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="text-right text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function IssueMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/5">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function IssueStatusBadge({ status }: { status: "Open" | "Ready" | "Closed" }) {
  const tone = issueStatusStyles[status];
  const classes =
    tone === "critical"
      ? "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20"
        : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}>
      {status}
    </span>
  );
}
