"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  XMarkIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

type TrackerIssueStatus = "Open" | "Ready" | "Closed";
type TrackerIssueType = string;
type TrackerDateRange = "7d" | "14d" | "30d";

type TrackerIssueRow = {
  id: string;
  issue: string;
  site?: string;
  type: TrackerIssueType;
  dateIdentified: string;
  daysOpen: number;
  status: TrackerIssueStatus;
};

type TrackerIssueDetail = {
  id: string;
  issue: string;
  site: string;
  type: TrackerIssueType;
  dateIdentified: string;
  daysOpen: number;
  status: TrackerIssueStatus;
  inspectionNote: string;
  reinspections: number;
  subcontractorName: string;
  subcontractorEmail: string;
  consultantName: string;
  consultantEmail: string;
  lastSentTo?: "subcontractor" | "consultant";
};

type TrackerPageResponse = {
  title: string;
  description: string;
  controls: {
    sites: string[];
    selectedSite: string;
    search: string;
    exportFileName: string;
  };
  summary: {
    open: number;
    readyForInspection: number;
    closedLast7Days: number;
  };
  extractedUnits: string[];
  inspectionDocuments: Array<{
    id: string;
    inspectionType: string;
    trade: string;
    reportDate: string;
    status: "Reviewing" | "Completed" | "In progress";
    issueCount: number;
    unitCount: number;
  }>;
  filters: {
    statuses: Array<"All" | TrackerIssueStatus>;
    types: Array<"All" | TrackerIssueType>;
    dateRanges: Array<{ label: string; value: TrackerDateRange }>;
    selectedStatus: "All" | TrackerIssueStatus;
    selectedType: "All" | TrackerIssueType;
    selectedDateRange: TrackerDateRange;
  };
  issueRegister: {
    siteSelected: boolean;
    columns: string[];
    items: TrackerIssueRow[];
  };
  selectedIssue: TrackerIssueDetail | null;
};

const statusClasses: Record<TrackerIssueStatus, string> = {
  Open: "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-300/20",
  Ready: "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-300/20",
  Closed: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-300/20",
};

export default function TrackerPage() {
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [data, setData] = useState<TrackerPageResponse | null>(null);
  const [selectedSite, setSelectedSite] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All" | TrackerIssueStatus>(
    "All"
  );
  const [selectedType, setSelectedType] = useState<"All" | TrackerIssueType>("All");
  const [selectedDateRange, setSelectedDateRange] =
    useState<TrackerDateRange>("30d");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTracker() {
      setLoading(true);

      try {
        const searchParams = new URLSearchParams({
          site: selectedSite,
          search,
          status: selectedStatus,
          type: selectedType,
          dateRange: selectedDateRange,
        });

        if (selectedIssueId) {
          searchParams.set("issueId", selectedIssueId);
        }

        const response = await fetch(`/api/tracker?${searchParams.toString()}`);
        const nextData = await response.json();

        if (!isMounted) {
          return;
        }

        setData(nextData);
        if (nextData?.controls?.selectedSite && nextData.controls.selectedSite !== selectedSite) {
          setSelectedSite(nextData.controls.selectedSite);
        }

        if (
          selectedIssueId &&
          !nextData?.issueRegister?.items?.some(
            (item: TrackerIssueRow) => item.id === selectedIssueId
          )
        ) {
          setSelectedIssueId(null);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setData(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTracker();

    return () => {
      isMounted = false;
    };
  }, [
    search,
    selectedDateRange,
    selectedIssueId,
    selectedSite,
    selectedStatus,
    selectedType,
  ]);

  const selectedIssue = data?.selectedIssue ?? null;
  const exportRows = useMemo(() => data?.issueRegister.items ?? [], [data]);
  const inspectionDocuments = Array.isArray(data?.inspectionDocuments)
    ? data.inspectionDocuments
    : [];
  const extractedUnits = Array.isArray(data?.extractedUnits) ? data.extractedUnits : [];
  async function refreshWithSelection(issueId?: string) {
    if (issueId) {
      setSelectedIssueId(issueId);
    }

    const searchParams = new URLSearchParams({
      site: selectedSite,
      search,
      status: selectedStatus,
      type: selectedType,
      dateRange: selectedDateRange,
    });

    if (issueId ?? selectedIssueId) {
      searchParams.set("issueId", issueId ?? selectedIssueId ?? "");
    }

    const response = await fetch(`/api/tracker?${searchParams.toString()}`);
    const nextData = await response.json();
    setData(nextData);
  }

  async function updateIssue(
    issueId: string,
    updates: {
      status?: TrackerIssueStatus;
      reinspections?: number;
      lastSentTo?: "subcontractor" | "consultant";
    }
  ) {
    setPendingAction(issueId);

    try {
      const response = await fetch(`/api/tracker/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await refreshWithSelection(issueId);
      }
    } finally {
      setPendingAction(null);
    }
  }

  function exportCsv() {
    const headers = data?.issueRegister.columns ?? [];
    const rows = exportRows.map((item) => {
      const values = headers.map((header) => {
        if (header === "Issue") return item.issue;
        if (header === "Site") return item.site ?? "";
        if (header === "Type") return item.type;
        if (header === "Date Identified") return formatShortDate(item.dateIdentified);
        if (header === "Days Open") return String(item.daysOpen);
        if (header === "Status") return item.status;
        return "";
      });

      return values
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [`${headers.join(",")}`, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data?.controls.exportFileName ?? "live-tracker-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function sendEmail(
    recipientType: "subcontractor" | "consultant",
    issue: TrackerIssueDetail
  ) {
    const recipientName =
      recipientType === "subcontractor"
        ? issue.subcontractorName
        : issue.consultantName;
    const recipientEmail =
      recipientType === "subcontractor"
        ? issue.subcontractorEmail
        : issue.consultantEmail;
    const subject = encodeURIComponent(`${issue.issue} - ${issue.site}`);
    const body = encodeURIComponent(
      `Hi ${recipientName},\n\nPlease review the following inspection issue:\n\nIssue: ${issue.issue}\nSite: ${issue.site}\nType: ${issue.type}\nDate identified: ${formatLongDate(issue.dateIdentified)}\nStatus: ${issue.status}\n\nInspection note:\n${issue.inspectionNote}\n`
    );

    await updateIssue(issue.id, { lastSentTo: recipientType });
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  }

  async function markReadyForInspection(issue: TrackerIssueDetail) {
    await updateIssue(issue.id, {
      status: "Ready",
      reinspections: issue.reinspections + 1,
    });
  }

  async function closeItem(issue: TrackerIssueDetail) {
    await updateIssue(issue.id, { status: "Closed" });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <p className="text-xs/6 font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
          Tracker
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2rem]">
          {data?.title ?? "Live tracker"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm/6 text-slate-600 dark:text-slate-300">
          {data?.description ?? "Track open issues from uploaded reports."}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900 dark:text-white">Site</label>
            <select
              value={selectedSite}
              onChange={(event) => setSelectedSite(event.target.value)}
              className="block w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
            >
              {(data?.controls.sites ?? []).map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900 dark:text-white">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400 dark:text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search issues"
                className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-11 text-sm/6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={exportCsv}
              disabled={!exportRows.length}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#6D5EF5] px-4 py-2 text-sm/6 font-semibold text-white transition hover:bg-[#5f51e6] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]"
            >
              <ArrowDownTrayIcon className="size-4" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-gray-400">
              Inspection reports
            </p>
            <h2 className="mt-1.5 text-[1.75rem] font-semibold text-slate-900 dark:text-white">
              {selectedSite}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
              These are the reports and unit labels currently available for this site.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm/6 font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {inspectionDocuments.length} reports loaded
          </div>
        </div>

        {extractedUnits.length ? (
          <div className="mt-5">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Units found in reports</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {extractedUnits.map((unit) => (
                <span key={unit} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm/6 font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                  {unit}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-slate-950/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                  <th className="px-5 py-4">Inspection type</th>
                  <th className="px-5 py-4">Trade</th>
                  <th className="px-5 py-4">Report date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Issues</th>
                  <th className="px-5 py-4">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-slate-900/30">
                {inspectionDocuments.map((report) => (
                  <tr key={report.id} className="text-sm/6 text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5">
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                      {report.inspectionType}
                    </td>
                    <td className="px-5 py-4">{report.trade}</td>
                    <td className="px-5 py-4">{formatLongDate(report.reportDate)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">{report.issueCount}</td>
                    <td className="px-5 py-4">{report.unitCount}</td>
                  </tr>
                ))}
                {!inspectionDocuments.length ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm/6 text-slate-500 dark:text-slate-400">
                      No reports are available for this site yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Open" value={data?.summary.open ?? 0} />
        <SummaryCard
          label="Ready for inspection"
          value={data?.summary.readyForInspection ?? 0}
        />
        <SummaryCard label="Closed (7d)" value={data?.summary.closedLast7Days ?? 0} />
      </section>

      <section className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/70 dark:ring-white/10">
        <div className="grid gap-4 md:grid-cols-3">
          <FilterSelect
            label="Status"
            value={selectedStatus}
            onChange={(value) =>
              setSelectedStatus(value as "All" | TrackerIssueStatus)
            }
            options={data?.filters.statuses ?? ["All", "Open", "Ready", "Closed"]}
          />
          <FilterSelect
            label="Type"
            value={selectedType}
            onChange={(value) => setSelectedType(value as "All" | TrackerIssueType)}
            options={data?.filters.types ?? [
              "All",
              "Hydraulic",
              "Structural",
              "Fire",
              "Electrical",
            ]}
          />
          <FilterSelect
            label="Date"
            value={selectedDateRange}
            onChange={(value) => setSelectedDateRange(value as TrackerDateRange)}
            options={(data?.filters.dateRanges ?? []).map((option) => option.value)}
            labels={Object.fromEntries(
              (data?.filters.dateRanges ?? []).map((option) => [
                option.value,
                option.label,
              ])
            )}
          />
        </div>
      </section>

      <section className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/70 dark:ring-white/10">
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-gray-400">
            Issue Register
          </p>
          <h2 className="mt-1.5 text-[1.75rem] font-semibold text-slate-900 dark:text-white">
            {data?.issueRegister.siteSelected
              ? `Issue Register (Site Selected: ${selectedSite})`
              : "Issue Register"}
          </h2>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-gray-400">
            Select an issue to open its details and actions.
          </p>
          {selectedIssue ? (
            <button
              type="button"
              onClick={() => setSelectedIssueId(selectedIssue.id)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <CheckCircleIcon className="size-4" aria-hidden="true" />
              Issue selected
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
              <thead className="bg-slate-100 dark:bg-slate-950/80">
                <tr className="text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-gray-400">
                  {(data?.issueRegister.columns ?? []).map((column) => (
                    <th key={column} className="px-5 py-4">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-slate-900/30">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`tracker-skeleton-${index}`}>
                      {Array.from({
                        length: data?.issueRegister.columns.length ?? 6,
                      }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-5 py-4">
                          <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data?.issueRegister.items.length ? (
                  data.issueRegister.items.map((issue) => (
                    <tr
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={`group cursor-pointer text-sm text-slate-700 transition hover:bg-slate-50 dark:text-gray-200 dark:hover:bg-white/5 ${
                        selectedIssueId === issue.id
                          ? "bg-indigo-50 ring-1 ring-inset ring-[#6D5EF5]/40 dark:bg-white/5"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <span>{issue.issue}</span>
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-800 dark:bg-white/10 dark:text-gray-200 dark:group-hover:bg-[#6D5EF5]/20 dark:group-hover:text-white">
                            View details
                          </span>
                        </div>
                      </td>
                      {!data.issueRegister.siteSelected ? (
                        <td className="px-5 py-4">{issue.site}</td>
                      ) : null}
                      <td className="px-5 py-4">{issue.type}</td>
                      <td className="px-5 py-4">{formatShortDate(issue.dateIdentified)}</td>
                      <td className="px-5 py-4">{issue.daysOpen}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[issue.status]}`}
                        >
                          {issue.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={data?.issueRegister.columns.length ?? 6}
                      className="px-5 py-8 text-center text-sm text-slate-500 dark:text-gray-400"
                    >
                      No issues found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Dialog
        open={selectedIssue != null}
        onClose={() => setSelectedIssueId(null)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <DialogPanel
              transition
              className="relative w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left shadow-xl ring-1 ring-slate-200 dark:bg-[#111827] dark:ring-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              {selectedIssue ? (
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#6D5EF5]/15 text-[#6D5EF5] dark:text-[#b8b0ff]">
                        <ClipboardDocumentCheckIcon
                          aria-hidden="true"
                          className="size-6"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-gray-400">
                          Selected Issue
                        </p>
                        <DialogTitle
                          as="h3"
                          className="mt-1.5 text-[1.75rem] font-semibold text-slate-900 dark:text-white"
                        >
                          {selectedIssue.issue}
                        </DialogTitle>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedIssueId(null)}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    >
                      <span className="sr-only">Close modal</span>
                      <XMarkIcon className="size-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <DetailItem label="Site" value={selectedIssue.site} />
                        <DetailItem label="Type" value={selectedIssue.type} />
                        <DetailItem
                          label="Date identified"
                          value={formatLongDate(selectedIssue.dateIdentified)}
                        />
                        <DetailItem
                          label="Days open"
                          value={String(selectedIssue.daysOpen)}
                        />
                        <DetailItem label="Status" value={selectedIssue.status} />
                        <DetailItem
                          label="Re-inspections"
                          value={String(selectedIssue.reinspections)}
                        />
                      </dl>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/30">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Inspection note
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-300">
                          {selectedIssue.inspectionNote}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
                      <ActionButton
                        label="Send to Sub"
                        icon={EnvelopeIcon}
                        onClick={() => sendEmail("subcontractor", selectedIssue)}
                        disabled={pendingAction === selectedIssue.id}
                      />
                      <ActionButton
                        label="Mark Ready for Inspection"
                        icon={ClipboardDocumentCheckIcon}
                        onClick={() => markReadyForInspection(selectedIssue)}
                        disabled={
                          pendingAction === selectedIssue.id ||
                          selectedIssue.status === "Ready"
                        }
                      />
                      <ActionButton
                        label="Send to Consultant"
                        icon={EnvelopeIcon}
                        onClick={() => sendEmail("consultant", selectedIssue)}
                        disabled={pendingAction === selectedIssue.id}
                      />
                      <ActionButton
                        label="Close Item"
                        icon={XCircleIcon}
                        onClick={() => closeItem(selectedIssue)}
                        disabled={
                          pendingAction === selectedIssue.id ||
                          selectedIssue.status === "Closed"
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
      <p className="text-sm/6 font-medium text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-900 dark:text-white">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof CheckCircleIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#6D5EF5] px-4 py-2 text-sm/6 font-semibold text-white transition hover:bg-[#5f51e6] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
