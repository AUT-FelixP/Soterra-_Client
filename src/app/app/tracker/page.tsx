"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

type Issue = {
  id: string;
  description: string;
  site: string;
  status: "Open" | "Ready" | "Closed";
  dateIdentified: string;
  reinspections: number;
  daysOpen: number;
  closedAt?: string;
};

const statusClasses = {
  Open:
    "inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-400/10 dark:text-red-400",
  Ready:
    "inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  Closed:
    "inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-400/10 dark:text-green-400",
} as const;

export default function TrackerPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIssueId, setPendingIssueId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch("/api/issues");
        const data = await res.json().catch(() => null);
        const items = Array.isArray(data) ? data : data?.items ?? [];

        if (!mounted) return;
        setIssues(items.map(mapIssue));
      } catch {
        if (!mounted) return;
        setIssues([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function updateIssue(
    issueId: string,
    updates: Partial<Pick<Issue, "status" | "reinspections">>
  ) {
    setPendingIssueId(issueId);
    const response = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }).catch(() => null);

    if (!response?.ok) {
      setPendingIssueId(null);
      return;
    }

    const data = await response.json().catch(() => null);
    const updatedIssue = data?.item ? mapIssue(data.item) : null;

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? updatedIssue ?? { ...issue, ...updates }
          : issue
      )
    );
    setPendingIssueId(null);
  }

  function generateEmail(issue: Issue) {
    const subject = encodeURIComponent(
      `Issue ${issue.id} - ${issue.description}`
    );
    const body = encodeURIComponent(
      `Hi Subcontractor,\n\nAn inspection at ${issue.site} on ${issue.dateIdentified} found the following issue:\n\n${issue.description}\n\nPlease investigate and rectify.\n\nThank you.`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function markReadyForInspection(issue: Issue) {
    return updateIssue(issue.id, {
      status: "Ready",
      reinspections: issue.reinspections + 1,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Live Tracker
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Open inspection issues extracted from uploaded reports.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Date identified</th>
                <th className="px-4 py-3">Days open</th>
                <th className="px-4 py-3">Re-inspections</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400"
                    colSpan={7}
                  >
                    Loading...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400"
                    colSpan={7}
                  >
                    No issues found.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {issue.description}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {issue.site}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {issue.dateIdentified}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {issue.daysOpen}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {issue.reinspections}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <Menu as="div" className="inline-block">
                        <MenuButton
                          className={`${statusClasses[issue.status]} inline-flex items-center gap-x-1.5 border border-transparent px-3 py-1.5 text-sm shadow-xs transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:shadow-none dark:focus-visible:outline-indigo-500`}
                        >
                          {issue.status}
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="size-4 opacity-70"
                          />
                        </MenuButton>

                        <MenuItems
                          anchor="bottom end"
                          portal
                          transition
                          className="z-50 w-56 [--anchor-gap:8px] rounded-xl bg-white p-1 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
                        >
                          {issue.status !== "Ready" ? (
                            <MenuItem>
                              <button
                                type="button"
                                disabled={pendingIssueId === issue.id}
                                onClick={() => markReadyForInspection(issue)}
                                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden disabled:opacity-60 dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                              >
                                Mark ready for inspection
                              </button>
                            </MenuItem>
                          ) : null}
                          {issue.status !== "Closed" ? (
                            <MenuItem>
                              <button
                                type="button"
                                disabled={pendingIssueId === issue.id}
                                onClick={() =>
                                  updateIssue(issue.id, { status: "Closed" })
                                }
                                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden disabled:opacity-60 dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                              >
                                Mark passed
                              </button>
                            </MenuItem>
                          ) : null}
                          {issue.status !== "Open" ? (
                            <MenuItem>
                              <button
                                type="button"
                                disabled={pendingIssueId === issue.id}
                                onClick={() =>
                                  updateIssue(issue.id, { status: "Open" })
                                }
                                className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden disabled:opacity-60 dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                              >
                                Reopen
                              </button>
                            </MenuItem>
                          ) : null}
                        </MenuItems>
                      </Menu>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={pendingIssueId === issue.id}
                          onClick={() =>
                            updateIssue(issue.id, {
                              reinspections: issue.reinspections + 1,
                            })
                          }
                          className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-60 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                        >
                          Add re-inspection
                        </button>
                        <button
                          type="button"
                          onClick={() => generateEmail(issue)}
                          className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                        >
                          Send email
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function mapIssue(issue: {
  id: string;
  description: string;
  site: string;
  status: "Open" | "Ready" | "Closed";
  dateIdentified: string;
  reinspections: number;
  closedAt?: string;
}): Issue {
  const endDate = issue.status === "Closed" ? issue.closedAt : undefined;

  return {
    ...issue,
    daysOpen: getDaysOpen(issue.dateIdentified, endDate),
  };
}

function getDaysOpen(dateIdentified: string, closedAt?: string) {
  const start = new Date(`${dateIdentified}T00:00:00Z`);
  const end = new Date(`${(closedAt ?? new Date().toISOString().slice(0, 10))}T00:00:00Z`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay)
  );
}
