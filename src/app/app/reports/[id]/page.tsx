import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportById } from "@/lib/mockReports";
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

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = getReportById(id);

  if (!report) {
    notFound();
  }

  const severityCount = report.issues.reduce(
    (counts, issue) => {
      counts[issue.severity] += 1;
      return counts;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  );
  const highestSeverity =
    report.issues.find((issue) => issue.severity === "Critical")?.severity ??
    report.issues.find((issue) => issue.severity === "High")?.severity ??
    report.issues.find((issue) => issue.severity === "Medium")?.severity ??
    report.issues[0]?.severity ??
    "Low";
  const reportDate = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
        <section className="report-print-card overflow-hidden rounded-[1.75rem] bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
                Project report
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {report.project}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Summary of inspection results, project details, and issue severity.
              </p>
            </div>

            <div className="report-print-hidden flex flex-wrap items-center gap-3">
              <Link
                href="/app/reports"
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/10 hover:bg-white/15"
              >
                Back to reports
              </Link>
              <ReportPrintActions />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Site" value={report.site} />
            <StatCard label="Inspector" value={report.inspector} />
            <StatCard label="Trade" value={report.trade} />
            <StatCard label="Created" value={reportDate} />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="report-print-card overflow-hidden rounded-2xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            <div className="border-b border-gray-100 px-6 py-5 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
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

            <dl className="grid gap-px bg-gray-100/80 sm:grid-cols-2 dark:bg-white/10">
              <SummaryItem label="Report ID" value={report.id} />
              <SummaryItem label="Total issues" value={String(report.issues.length)} />
              <SummaryItem label="Highest severity" value={highestSeverity} />
              <SummaryItem
                label="Critical items"
                value={String(severityCount.Critical)}
              />
            </dl>

            <div className="border-t border-gray-100 px-6 py-5 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Severity distribution
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(severityCount).map(([severity, count]) => (
                  <div
                    key={severity}
                    className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${severityStyles[severity as keyof typeof severityStyles]}`}
                      >
                        {severity}
                      </span>
                      <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="report-print-card overflow-hidden rounded-2xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            <div className="border-b border-gray-100 px-6 py-5 dark:border-white/10">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Extracted metadata
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Structured details captured from the uploaded inspection file.
              </p>
            </div>
            <dl className="divide-y divide-gray-100 dark:divide-white/10">
              <DetailRow label="Project" value={report.project} />
              <DetailRow label="Site" value={report.site} />
              <DetailRow label="Trade" value={report.trade} />
              <DetailRow label="Inspector" value={report.inspector} />
              <DetailRow label="Created" value={reportDate} />
              <DetailRow label="Status" value={report.status} />
            </dl>
          </div>
        </section>

        <section className="report-print-card overflow-hidden rounded-2xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Issue register
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Individual findings from the project report, ready to download.
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {report.issues.length} item{report.issues.length === 1 ? "" : "s"} identified
            </p>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-white/10">
            {report.issues.map((issue, index) => (
              <li key={issue.id} className="px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
                      Issue {index + 1}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                      {issue.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Logged under {report.trade.toLowerCase()} works at {report.site}.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {issue.id}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${severityStyles[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                  </div>
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
    <div className="rounded-2xl bg-white/6 px-4 py-4 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-6 py-5 dark:bg-gray-900">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-4">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
