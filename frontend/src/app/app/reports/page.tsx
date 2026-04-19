"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  uploadedAt?: string;
  status: "Reviewing" | "Completed" | "In progress";
  inspectionType?: string;
  summary?: string;
  inspector?: string;
  trade?: string;
  issues: Array<{
    id: string;
    title: string;
    severity: "Low" | "Medium" | "High" | "Critical";
  }>;
};

type ApiReport = Partial<Report> & {
  id?: string | null;
  project?: string | null;
  site?: string | null;
  createdAt?: string | null;
  uploadedAt?: string | null;
  status?: Report["status"] | string | null;
  inspectionType?: string | null;
  summary?: string | null;
  inspector?: string | null;
  trade?: string | null;
  issues?: Report["issues"] | null;
};

const statusOptions = ["All", "Reviewing", "In progress", "Completed"] as const;
const processingUploadMessage =
  "The file is uploaded and the data extraction is in progress.";
const requiredLabelClassName =
  "flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white";
const requiredBadgeClassName =
  "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-200";

function getUploadErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const detail = "detail" in payload ? payload.detail : null;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string" &&
    detail.message.trim()
  ) {
    return detail.message;
  }

  const error = "error" in payload ? payload.error : null;
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  const message = "message" in payload ? payload.message : null;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return null;
}

function normalizeReport(item: ApiReport, index: number): Report {
  const site =
    typeof item.site === "string" && item.site.trim()
      ? item.site.trim()
      : "Unknown site";
  const project =
    typeof item.project === "string" && item.project.trim()
      ? item.project.trim()
      : "Untitled report";
  const createdAt =
    typeof item.createdAt === "string" && item.createdAt.trim()
      ? item.createdAt
      : new Date().toISOString();
  const status: Report["status"] =
    item.status === "Completed" ||
    item.status === "In progress" ||
    item.status === "Reviewing"
      ? item.status
      : "Reviewing";

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `report-${index}-${project.toLowerCase().replace(/\s+/g, "-")}`,
    project,
    site,
    createdAt,
    uploadedAt:
      typeof item.uploadedAt === "string" && item.uploadedAt.trim()
        ? item.uploadedAt
        : undefined,
    status,
    inspectionType:
      typeof item.inspectionType === "string" ? item.inspectionType : undefined,
    summary: typeof item.summary === "string" ? item.summary : undefined,
    inspector: typeof item.inspector === "string" ? item.inspector : undefined,
    trade: typeof item.trade === "string" ? item.trade : undefined,
    issues: Array.isArray(item.issues) ? item.issues : [],
  };
}

function toDateKey(value: string) {
  const directMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) {
    return directMatch[1];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    site: "All",
    status: "All",
  });

  const loadReports = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const response = await fetch("/api/reports");
      if (!response.ok) {
        throw new Error("Could not load reports.");
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setReports(items.map((item: ApiReport, index: number) => normalizeReport(item, index)));
      setUploadError("");
    } catch (error) {
      setReports([]);
      setUploadError(
        error instanceof Error ? error.message : "Could not load reports."
      );
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    const hasProcessing = reports.some((report) => report.status === "In progress");
    if (!hasProcessing) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadReports({ silent: true });
    }, 2500);

    return () => window.clearInterval(interval);
  }, [loadReports, reports]);

  useEffect(() => {
    const hasProcessing = reports.some((report) => report.status === "In progress");
    if (!hasProcessing && uploadMessage === processingUploadMessage) {
      setUploadMessage("");
    }
  }, [reports, uploadMessage]);

  const sites = useMemo(() => {
    const unique = new Set(
      reports
        .map((report) => report.site.trim())
        .filter((site) => site && site !== "All")
    );
    return ["All", ...Array.from(unique)];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const filterDateKey = toDateKey(report.uploadedAt ?? report.createdAt);

      if (filters.status !== "All" && report.status !== filters.status) {
        return false;
      }
      if (filters.site !== "All" && report.site !== filters.site) {
        return false;
      }
      if (filters.start && filterDateKey && filterDateKey < filters.start) {
        return false;
      }
      if (filters.end && filterDateKey && filterDateKey > filters.end) {
        return false;
      }
      return true;
    });
  }, [reports, filters]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    setSubmitting(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const formData = new FormData(form);
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) {
        throw new Error("Please choose a PDF file to upload.");
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to upload report.";
        try {
          const payload = (await response.json()) as unknown;
          errorMessage = getUploadErrorMessage(payload) ?? errorMessage;
        } catch {
          // Fall back to the generic message when the backend response is not JSON.
        }
        throw new Error(errorMessage);
      }

      const payload = await response.json();
      const nextItem = payload?.item as ApiReport | undefined;
      const isDuplicate = Boolean(payload?.isDuplicate);
      const isProcessing = Boolean(payload?.isProcessing);

      if (nextItem) {
        const normalizedItem = normalizeReport(nextItem, 0);
        setReports((prev) => {
          const remaining = prev.filter((report) => report.id !== normalizedItem.id);
          return [normalizedItem, ...remaining];
        });
      } else {
        void loadReports({ silent: true });
      }

      form.reset();
      setSelectedFileName("");
      setModalOpen(false);
        setUploadMessage(
        isDuplicate
          ? "That PDF was already uploaded, so the existing report was reused."
          : isProcessing
            ? processingUploadMessage
            : "The file was uploaded and the report is ready."
      );
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-2 text-sm/6 text-slate-600 dark:text-slate-300">
            Uploaded inspection reports and the issues found in them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
        >
          Upload Report
        </button>
      </div>

      {uploadMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm/6 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          {uploadMessage}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              Date range
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="date"
                value={filters.start}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, start: event.target.value }))
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
              />
              <input
                type="date"
                value={filters.end}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, end: event.target.value }))
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              Site
            </label>
            <select
              value={filters.site}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, site: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:*:bg-slate-950 dark:*:text-white"
            >
              {sites.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:*:bg-slate-950 dark:*:text-white"
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/80 dark:text-slate-400">
            <tr>
              <th className="px-6 py-3">Report</th>
              <th className="px-6 py-3">Site</th>
              <th className="px-6 py-3">Issues found</th>
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
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                    </td>
                  </tr>
                ))
              : filteredReports.map((report) => (
                  <tr key={report.id} className="text-sm/6 text-slate-700 transition-colors even:bg-slate-50 hover:bg-slate-50 dark:text-slate-200 dark:even:bg-slate-950/25 dark:hover:bg-white/5">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      <div>
                        <p>{report.project}</p>
                        {report.inspectionType ? (
                          <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                            {report.inspectionType}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {report.site}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {Array.isArray(report.issues) ? report.issues.length : 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(report.uploadedAt ?? report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/app/reports/${report.id}`}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm/6 font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      >
                        {report.status === "In progress" ? "Track upload" : "View report"}
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && filteredReports.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm/6 text-slate-500 dark:text-slate-400">
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
            className="w-full max-w-lg transform rounded-xl bg-white p-5 shadow-xl transition data-closed:scale-95 data-closed:opacity-0 dark:bg-gray-900 dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Upload report
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add a new inspection report and metadata for extraction.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Fields marked as <span className={requiredBadgeClassName}>Required</span> must
              be completed before upload.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {uploadError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {uploadError}
                </div>
              ) : null}
              <div>
                <label
                  htmlFor="report-file"
                  className={requiredLabelClassName}
                >
                  Report file
                  <span className={requiredBadgeClassName}>Required</span>
                </label>
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                    >
                      Choose file
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedFileName ? selectedFileName : "No file selected"}
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="report-file"
                    type="file"
                    name="file"
                    required
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                      const next = event.currentTarget.files?.[0]?.name ?? "";
                      setSelectedFileName(next);
                    }}
                    className="sr-only"
                  />
                </div>
              </div>
              <div>
                <label className={requiredLabelClassName}>
                  Project name
                  <span className={requiredBadgeClassName}>Required</span>
                </label>
                <input
                  name="project"
                  required
                  placeholder="Enter project name"
                  className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-amber-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-amber-300/60 dark:focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className={requiredLabelClassName}>
                  Site
                  <span className={requiredBadgeClassName}>Required</span>
                </label>
                <input
                  name="site"
                  required
                  placeholder="Enter site name"
                  className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-amber-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-amber-300/60 dark:focus:outline-indigo-500"
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
                    placeholder="General"
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
