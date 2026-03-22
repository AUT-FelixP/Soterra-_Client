"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

type Report = {
  id: string;
  project: string;
  site: string;
  createdAt: string;
  status: "Reviewing" | "Completed" | "In progress";
  inspector?: string;
  trade?: string;
  issues: Array<{
    id: string;
    title: string;
    severity: "Low" | "Medium" | "High" | "Critical";
  }>;
};

const statusOptions = ["All", "Reviewing", "In progress", "Completed"] as const;

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    site: "All",
    status: "All",
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports");
      const data = await response.json();
      setReports(Array.isArray(data) ? data : data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const sites = useMemo(() => {
    const unique = new Set(reports.map((report) => report.site));
    return ["All", ...Array.from(unique)];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (filters.status !== "All" && report.status !== filters.status) {
        return false;
      }
      if (filters.site !== "All" && report.site !== filters.site) {
        return false;
      }
      if (filters.start && report.createdAt < filters.start) {
        return false;
      }
      if (filters.end && report.createdAt > filters.end) {
        return false;
      }
      return true;
    });
  }, [reports, filters]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload report.");
      }

      await loadReports();
      event.currentTarget.reset();
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Filterable inspection reports and AI summaries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
        >
          Upload Report
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Date range
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="date"
                value={filters.start}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, start: event.target.value }))
                }
                className="min-w-0 flex-1 rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
              />
              <input
                type="date"
                value={filters.end}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, end: event.target.value }))
                }
                className="min-w-0 flex-1 rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Site
            </label>
            <select
              value={filters.site}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, site: event.target.value }))
              }
              className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 dark:*:bg-gray-900 dark:*:text-white"
            >
              {sites.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 dark:*:bg-gray-900 dark:*:text-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() =>
                setFilters({ start: "", end: "", site: "All", status: "All" })
              }
              className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-900/70 dark:text-gray-400">
            <tr>
              <th className="px-6 py-3">Report</th>
              <th className="px-6 py-3">Site</th>
              <th className="px-6 py-3">Failed items</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Project report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`report-loading-${index}`}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-12 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-4 w-24 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </td>
                  </tr>
                ))
              : filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="even:bg-gray-50 dark:even:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {report.project}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {report.site}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {report.issues.length}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/app/reports/${report.id}`}
                        className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && filteredReports.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No reports match the selected filters.
          </div>
        ) : null}
      </div>

      <Dialog open={modalOpen} onClose={setModalOpen} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/60 transition-opacity data-closed:opacity-0"
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl transition data-closed:scale-95 data-closed:opacity-0 dark:bg-gray-900 dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Upload report
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add a new inspection report and metadata for AI extraction.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Report file
                </label>
                <input
                  type="file"
                  name="file"
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-400 dark:file:bg-indigo-500/10 dark:file:text-indigo-200 dark:hover:file:bg-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Project name
                </label>
                <input
                  name="project"
                  required
                  placeholder="Harbor View Tower"
                  className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Site
                </label>
                <input
                  name="site"
                  required
                  placeholder="Bayfront Site A"
                  className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="Reviewing"
                    className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                  >
                    {statusOptions
                      .filter((status) => status !== "All")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Trade
                  </label>
                  <input
                    name="trade"
                    placeholder="Structural"
                    className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Inspector
                </label>
                <input
                  name="inspector"
                  placeholder="Alex Morgan"
                  className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {submitting ? "Uploading..." : "Upload report"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
