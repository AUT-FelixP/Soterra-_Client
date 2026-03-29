"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
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
type TrackerIssueType = "Hydraulic" | "Structural" | "Fire" | "Electrical";
type TrackerDateRange = "7d" | "14d" | "30d";
type InspectionMatrixStatus = "not_started" | "failed" | "ready" | "passed";

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
  inspectionStatusTracker: {
    siteLabel: string;
    overview: string;
    lots: string[];
    rows: Array<{
      inspectionType: string;
      cells: Array<{
        lot: string;
        status: InspectionMatrixStatus;
      }>;
    }>;
    progress: Array<{
      lot: string;
      percent: number;
      currentStage: string;
      currentStatus: InspectionMatrixStatus;
      completedStages: number;
      totalStages: number;
    }>;
  };
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

type SelectedMatrixCell = {
  inspectionType: string;
  lot: string;
  status: InspectionMatrixStatus;
};

const statusClasses: Record<TrackerIssueStatus, string> = {
  Open: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-300/20",
  Ready: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-300/20",
  Closed: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/20",
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
  const [selectedMatrixCell, setSelectedMatrixCell] =
    useState<SelectedMatrixCell | null>(null);

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
  const matrixStatusMeta: Record<
    InspectionMatrixStatus,
    {
      label: string;
      dotClass: string;
      modalTitle: string;
      modalDescription: string;
    }
  > = {
    not_started: {
      label: "Not started",
      dotClass: "border border-gray-500 bg-white",
      modalTitle: "Not Started view",
      modalDescription:
        "This inspection area has not started yet for the selected lot or zone.",
    },
    failed: {
      label: "Failed",
      dotClass: "border border-red-700 bg-red-500",
      modalTitle: "Failed inspection view",
      modalDescription:
        "This inspection area has failed and needs attention before it can move forward.",
    },
    ready: {
      label: "Ready for inspection",
      dotClass: "border border-amber-600 bg-yellow-300",
      modalTitle: "Ready for inspection view",
      modalDescription:
        "This inspection area is ready to be checked by the inspection team.",
    },
    passed: {
      label: "Passed",
      dotClass: "border border-green-700 bg-lime-500",
      modalTitle: "Passed inspection view",
      modalDescription:
        "This inspection area has passed for the selected lot or zone.",
    },
  };

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
      <div className="rounded-lg bg-gray-800 px-6 py-8 shadow-sm dark:bg-gray-800/70">
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          {data?.title ?? "Live Tracker"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-gray-300">
          {data?.description ?? "Open inspection issues extracted from reports."}
        </p>
      </div>

      <section className="rounded-2xl bg-[#1f2937] px-6 py-6 shadow-sm ring-1 ring-white/10">
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Site</label>
            <select
              value={selectedSite}
              onChange={(event) => setSelectedSite(event.target.value)}
              className="block w-full appearance-none rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30"
            >
              {(data?.controls.sites ?? []).map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search issues"
                className="block w-full rounded-xl border border-white/10 bg-[#111827] py-3 pr-4 pl-11 text-sm text-white outline-none transition placeholder:text-gray-400 focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={exportCsv}
              disabled={!exportRows.length}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#6D5EF5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f51e6] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]"
            >
              <ArrowDownTrayIcon className="size-4" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#1f2937] px-6 py-6 shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
              Inspection Status Tracker
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {data?.inspectionStatusTracker.siteLabel ?? selectedSite}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {data?.inspectionStatusTracker.overview ??
                "Overview of inspection progress across all lots"}
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-gray-200">
            {data?.inspectionStatusTracker.lots.length ?? 0} lots loaded
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl bg-gray-800/75 ring-1 ring-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#111827]">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  <th className="sticky left-0 bg-[#111827] px-4 py-4">Inspection Type</th>
                  {(data?.inspectionStatusTracker.lots ?? []).map((lot) => (
                    <th key={lot} className="px-4 py-4 text-center whitespace-nowrap">
                      {lot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data?.inspectionStatusTracker.rows.map((row) => (
                  <tr key={row.inspectionType} className="text-sm text-gray-200">
                    <td className="sticky left-0 bg-[#1f2937] px-4 py-4 font-medium text-white">
                      {row.inspectionType}
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={`${row.inspectionType}-${cell.lot}`}
                        className="px-4 py-4 text-center"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedMatrixCell({
                              inspectionType: row.inspectionType,
                              lot: cell.lot,
                              status: cell.status,
                            })
                          }
                          className="group inline-flex items-center justify-center rounded-full p-1.5"
                        >
                          <span className="sr-only">
                            Open {matrixStatusMeta[cell.status].label} view for{" "}
                            {row.inspectionType} in {cell.lot}
                          </span>
                          <span
                            className={`block size-4 rounded-full ${matrixStatusMeta[cell.status].dotClass} transition group-hover:scale-110`}
                          />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-200">
          {(["passed", "ready", "failed", "not_started"] as InspectionMatrixStatus[]).map(
            (status) => (
              <span key={status} className="inline-flex items-center gap-2">
                <span
                  className={`block size-4 rounded-full ${matrixStatusMeta[status].dotClass}`}
                />
                {matrixStatusMeta[status].label}
              </span>
            )
          )}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-white">Progress</h3>
        <dl className="mt-5 grid grid-cols-1 divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-white/10 dark:bg-gray-800/75 dark:shadow-none dark:inset-ring dark:inset-ring-white/10 xl:grid-cols-4">
          {(data?.inspectionStatusTracker.progress ?? []).map((item) => {
            const currentStatus =
              item.currentStatus in matrixStatusMeta
                ? item.currentStatus
                : "not_started";
            const changeType =
              currentStatus === "passed" || currentStatus === "ready"
                ? "increase"
                : currentStatus === "failed"
                  ? "decrease"
                  : "neutral";

            return (
              <div key={item.lot} className="px-5 py-6 sm:px-6 sm:py-7">
                <dt className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.lot}
                </dt>
                <dd className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-semibold tracking-tight text-indigo-600 dark:text-indigo-400">
                        {item.percent}%
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {item.completedStages}/{item.totalStages} stages passed
                      </span>
                    </div>
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        changeType === "increase"
                          ? "bg-green-100 text-green-800 dark:bg-green-400/10 dark:text-green-400"
                          : changeType === "decrease"
                            ? "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-400"
                            : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300"
                      }`}
                    >
                      {changeType === "increase" ? (
                        <ArrowUpIcon
                          aria-hidden="true"
                          className="mr-1 size-5 shrink-0 text-green-500 dark:text-green-400"
                        />
                      ) : changeType === "decrease" ? (
                        <ArrowDownIcon
                          aria-hidden="true"
                          className="mr-1 size-5 shrink-0 text-red-500 dark:text-red-400"
                        />
                      ) : null}
                      {matrixStatusMeta[currentStatus].label}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Current stage
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.currentStage}
                    </p>
                  </div>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Open" value={data?.summary.open ?? 0} />
        <SummaryCard
          label="Ready for inspection"
          value={data?.summary.readyForInspection ?? 0}
        />
        <SummaryCard label="Closed (7d)" value={data?.summary.closedLast7Days ?? 0} />
      </section>

      <section className="rounded-2xl bg-[#1f2937] px-6 py-6 shadow-sm ring-1 ring-white/10">
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

      <section className="rounded-2xl bg-[#1f2937] px-6 py-6 shadow-sm ring-1 ring-white/10">
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
            Issue Register
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {data?.issueRegister.siteSelected
              ? `Issue Register (Site Selected: ${selectedSite})`
              : "Issue Register"}
          </h2>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            Select an issue to open its details and actions.
          </p>
          {selectedIssue ? (
            <button
              type="button"
              onClick={() => setSelectedIssueId(selectedIssue.id)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <CheckCircleIcon className="size-4" aria-hidden="true" />
              Issue selected
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#111827]">
                <tr className="text-left text-xs font-semibold tracking-[0.18em] text-gray-400 uppercase">
                  {(data?.issueRegister.columns ?? []).map((column) => (
                    <th key={column} className="px-5 py-4">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#1f2937]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`tracker-skeleton-${index}`}>
                      {Array.from({
                        length: data?.issueRegister.columns.length ?? 6,
                      }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-5 py-4">
                          <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data?.issueRegister.items.length ? (
                  data.issueRegister.items.map((issue) => (
                    <tr
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={`group cursor-pointer text-sm text-gray-200 transition hover:bg-white/5 ${
                        selectedIssueId === issue.id
                          ? "bg-white/5 ring-1 ring-inset ring-[#6D5EF5]/40"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <span>{issue.issue}</span>
                          <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-gray-200 transition group-hover:bg-[#6D5EF5]/20 group-hover:text-white">
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
                      className="px-5 py-8 text-center text-sm text-gray-400"
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
              className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#111827] text-left shadow-xl ring-1 ring-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              {selectedIssue ? (
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#6D5EF5]/15 text-[#b8b0ff]">
                        <ClipboardDocumentCheckIcon
                          aria-hidden="true"
                          className="size-6"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
                          Selected Issue
                        </p>
                        <DialogTitle
                          as="h3"
                          className="mt-2 text-2xl font-semibold text-white"
                        >
                          {selectedIssue.issue}
                        </DialogTitle>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedIssueId(null)}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
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

                      <div className="rounded-2xl border border-white/10 bg-[#1f2937] p-4">
                        <p className="text-sm font-semibold text-white">
                          Inspection note
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-300">
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

      <Dialog
        open={selectedMatrixCell != null}
        onClose={() => setSelectedMatrixCell(null)}
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
              className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#111827] text-left shadow-xl ring-1 ring-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              {selectedMatrixCell ? (
                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                          selectedMatrixCell.status === "failed"
                            ? "bg-red-500/15 text-red-300"
                            : selectedMatrixCell.status === "ready"
                              ? "bg-yellow-500/15 text-yellow-200"
                              : selectedMatrixCell.status === "passed"
                                ? "bg-green-500/15 text-green-200"
                                : "bg-gray-500/15 text-gray-200"
                        }`}
                      >
                        <span
                          className={`block size-4 rounded-full ${matrixStatusMeta[selectedMatrixCell.status].dotClass}`}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
                          Inspection Status Tracker
                        </p>
                        <DialogTitle
                          as="h3"
                          className="mt-2 text-2xl font-semibold text-white"
                        >
                          {matrixStatusMeta[selectedMatrixCell.status].modalTitle}
                        </DialogTitle>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMatrixCell(null)}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <span className="sr-only">Close modal</span>
                      <XMarkIcon className="size-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-5">
                    <p className="text-sm leading-6 text-gray-300">
                      {matrixStatusMeta[selectedMatrixCell.status].modalDescription}
                    </p>
                    <dl className="grid gap-4 sm:grid-cols-3">
                      <DetailItem
                        label="Site"
                        value={data?.inspectionStatusTracker.siteLabel ?? selectedSite}
                      />
                      <DetailItem label="Lot / Zone" value={selectedMatrixCell.lot} />
                      <DetailItem
                        label="Inspection Type"
                        value={selectedMatrixCell.inspectionType}
                      />
                    </dl>
                    <div className="rounded-2xl border border-white/10 bg-[#1f2937] p-4">
                      <p className="text-sm font-semibold text-white">Current status</p>
                      <p className="mt-2 text-sm text-gray-300">
                        {matrixStatusMeta[selectedMatrixCell.status].label}
                      </p>
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
    <div className="rounded-2xl bg-[#1f2937] px-5 py-5 shadow-sm ring-1 ring-white/10">
      <p className="text-sm font-medium text-gray-300">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
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
      <label className="block text-sm font-medium text-white">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full appearance-none rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30"
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
      <dt className="text-xs font-semibold tracking-[0.18em] text-gray-400 uppercase">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-white">{value}</dd>
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
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#6D5EF5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f51e6] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]"
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
