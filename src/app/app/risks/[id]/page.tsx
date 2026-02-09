"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckIcon,
  HandThumbUpIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { classNames } from "@/lib/classNames";

type Risk = {
  id: string;
  title: string;
  site: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Investigating" | "Resolved";
  owner?: string;
  createdAt: string;
  description: string;
  timeline: {
    id: string;
    type: "created" | "status" | "owner" | "note";
    content: string;
    target?: string;
    date: string;
    datetime: string;
  }[];
};

export default function RiskDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ownerSelection, setOwnerSelection] = useState("Sam Carter");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/risks/${id}`);
        if (!response.ok) {
          setRisk(null);
          return;
        }
        const data = await response.json();
        if (!isMounted) return;
        setRisk(data?.item ?? null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (id) {
      load();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const severityBadge = useMemo(
    () => (severity: Risk["severity"]) =>
      classNames(
        severity === "Critical"
          ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
          : severity === "High"
            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
            : severity === "Medium"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      ),
    []
  );

  const statusBadge = useMemo(
    () => (status: Risk["status"]) =>
      classNames(
        status === "Resolved"
          ? "text-emerald-700 dark:text-emerald-300"
          : status === "Investigating"
            ? "text-blue-700 dark:text-blue-300"
            : "text-gray-700 dark:text-gray-300",
        "inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium inset-ring inset-ring-gray-200 dark:inset-ring-white/10"
      ),
    []
  );

  const handleUpdate = async (updates: Partial<Risk>) => {
    if (!risk || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/risks/${risk.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) return;
      const data = await response.json();
      setRisk(data?.item ?? risk);
    } finally {
      setSaving(false);
    }
  };

  const timelineIcon = (type: Risk["timeline"][number]["type"]) => {
    if (type === "owner") {
      return {
        icon: UserIcon,
        background: "bg-gray-400 dark:bg-gray-600",
      };
    }
    if (type === "status") {
      return {
        icon: CheckIcon,
        background: "bg-green-500",
      };
    }
    return {
      icon: HandThumbUpIcon,
      background: "bg-blue-500",
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
        <div className="h-40 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Risk not found.
        </p>
        <Link
          href="/app/risks"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          Back to risks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
            Risk detail
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {risk.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {risk.site} - {risk.createdAt}
          </p>
        </div>
        <Link
          href="/app/risks"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
        >
          Back to risks
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Overview
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {risk.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className={severityBadge(risk.severity)}>{risk.severity}</span>
              <span className={statusBadge(risk.status)}>
                <svg
                  viewBox="0 0 6 6"
                  aria-hidden="true"
                  className={classNames(
                    risk.status === "Resolved"
                      ? "fill-emerald-500 dark:fill-emerald-400"
                      : risk.status === "Investigating"
                        ? "fill-blue-500 dark:fill-blue-400"
                        : "fill-gray-500 dark:fill-gray-400",
                    "size-1.5"
                  )}
                >
                  <circle r={3} cx={3} cy={3} />
                </svg>
                {risk.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-600 shadow-xs inset-ring inset-ring-gray-300 dark:bg-white/5 dark:text-gray-300 dark:inset-ring-white/10">
                Owner: {risk.owner ?? "Unassigned"}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Activity timeline
            </h2>
            <div className="mt-6 flow-root">
              <ul role="list" className="-mb-8">
                {risk.timeline.map((event, eventIdx) => {
                  const iconMeta = timelineIcon(event.type);
                  const Icon = iconMeta.icon;

                  return (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIdx !== risk.timeline.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-white/10"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={classNames(
                                iconMeta.background,
                                "flex size-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-950"
                              )}
                            >
                              <Icon aria-hidden="true" className="size-5 text-white" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {event.content}{" "}
                                {event.target ? (
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {event.target}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            <div className="text-right text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              <time dateTime={event.datetime}>{event.date}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Actions
            </h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate({ status: "Resolved" })}
                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Mark resolved
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate({ status: "Investigating" })}
                className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-70 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
              >
                Start investigation
              </button>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Assign owner (mock)
                </label>
                <select
                  value={ownerSelection}
                  onChange={(event) => setOwnerSelection(event.target.value)}
                  className="w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 dark:*:bg-gray-900 dark:*:text-white"
                >
                  <option>Sam Carter</option>
                  <option>Jordan Kim</option>
                  <option>Avery Chen</option>
                  <option>Riley Brooks</option>
                </select>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleUpdate({ owner: ownerSelection })}
                  className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 disabled:opacity-70 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                >
                  Assign owner
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm outline-1 outline-black/5 dark:bg-gray-900/60 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Current status
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Status updates are logged for audit readiness.
            </p>
            <div
              className={classNames(
                risk.status !== "Resolved"
                  ? "bg-yellow-50 dark:bg-yellow-500/10 dark:outline dark:outline-yellow-500/15"
                  : "bg-emerald-50 dark:bg-emerald-500/10 dark:outline dark:outline-emerald-500/15",
                "mt-4 rounded-md p-4"
              )}
            >
              <div className="flex">
                <div className="shrink-0">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className={classNames(
                      risk.status !== "Resolved"
                        ? "text-yellow-400 dark:text-yellow-300"
                        : "text-emerald-500 dark:text-emerald-300",
                      "size-5"
                    )}
                  />
                </div>
                <div className="ml-3">
                  <h3
                    className={classNames(
                      risk.status !== "Resolved"
                        ? "text-yellow-800 dark:text-yellow-100"
                        : "text-emerald-800 dark:text-emerald-100",
                      "text-sm font-medium"
                    )}
                  >
                    {risk.status !== "Resolved" ? "Attention needed" : "Risk resolved"}
                  </h3>
                  <div
                    className={classNames(
                      risk.status !== "Resolved"
                        ? "text-yellow-700 dark:text-yellow-100/80"
                        : "text-emerald-700 dark:text-emerald-100/80",
                      "mt-2 text-sm"
                    )}
                  >
                    <p>{risk.status} - Owner {risk.owner ?? "Unassigned"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

