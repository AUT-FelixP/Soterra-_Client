import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportById } from "@/lib/mockReports";

export default function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = getReportById(params.id);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
            Report details
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {report.project}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {report.site} ·{" "}
            {new Date(report.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/app/reports"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
        >
          Back to reports
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900/60 dark:shadow-none dark:inset-ring dark:inset-ring-white/10">
        <div className="px-4 py-6 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Extracted fields
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI extracted metadata and inspection details.
          </p>
        </div>
        <div className="border-t border-gray-100 dark:border-white/10">
          <dl className="divide-y divide-gray-100 dark:divide-white/10">
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Report ID
              </dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                {report.id}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Project
              </dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                {report.project}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Site
              </dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                {report.site}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Trade
              </dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                {report.trade}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Inspector
              </dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                {report.inspector}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Status
              </dt>
              <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-300">
                {report.status}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900/60 dark:shadow-none dark:inset-ring dark:inset-ring-white/10">
        <div className="px-4 py-6 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Issues detected
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI extracted issues requiring review.
          </p>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-white/10">
          {report.issues.map((issue) => (
            <li key={issue.id} className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {issue.title}
                </p>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  {issue.severity}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
