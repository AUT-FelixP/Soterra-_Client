"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

type Issue = {
  id: string;
  description: string;
  site: string;
  status: "Open" | "Closed";
  dateIdentified: string;
  reinspections: number;
  daysOpen: number;
  closedAt?: string;
};

const statusClasses = {
  Open:
    "inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-400/10 dark:text-red-400",
  Closed:
    "inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-400/10 dark:text-green-400",
} as const;

export default function TrackerPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function updateIssueStatus(
    issueId: string,
    status: Issue["status"]
  ) {
    const response = await fetch(`/api/issues/${issueId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const data = await response.json().catch(() => null);
    const updatedIssue = data?.item ? mapIssue(data.item) : null;

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? updatedIssue ?? { ...issue, status }
          : issue
      )
    );
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
                      <Menu as="div" className="relative inline-block">
                        <MenuButton
                          className={`${statusClasses[issue.status]} inline-flex items-center gap-x-1.5 border border-transparent shadow-xs transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:shadow-none dark:focus-visible:outline-indigo-500`}
                        >
                          {issue.status}
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="size-4 opacity-70"
                          />
                        </MenuButton>

                        <MenuItems
                          transition
                          className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
                        >
                          {issue.status === "Open" ? (
                            <MenuItem>
                              <button
                                type="button"
                                onClick={() =>
                                  updateIssueStatus(issue.id, "Closed")
                                }
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                              >
                                Mark passed
                              </button>
                            </MenuItem>
                          ) : (
                            <MenuItem>
                              <button
                                type="button"
                                onClick={() =>
                                  updateIssueStatus(issue.id, "Open")
                                }
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5 dark:data-focus:text-white"
                              >
                                Reopen
                              </button>
                            </MenuItem>
                          )}
                        </MenuItems>
                      </Menu>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <button
                        type="button"
                        onClick={() => generateEmail(issue)}
                        className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                      >
                        Send email
                      </button>
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
  status: "Open" | "Closed";
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
