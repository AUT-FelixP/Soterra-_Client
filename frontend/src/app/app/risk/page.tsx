"use client";

import { useEffect, useState } from "react";
import type { DashboardRiskResponse } from "@/lib/dashboardAppData";
import {
  DashboardBadge,
  DashboardDataTable,
  DashboardPageIntro,
  DashboardSection,
  DashboardSelect,
} from "../components/dashboard-ui";

export default function RiskPage() {
  const [site, setSite] = useState("All sites");
  const [windowValue, setWindowValue] = useState("30d");
  const [inspectionId, setInspectionId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<DashboardRiskResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    const searchParams = new URLSearchParams({
      site,
      window: windowValue,
    });

    if (inspectionId) {
      searchParams.set("inspectionId", inspectionId);
    }

    fetch(`/api/dashboard/risk?${searchParams.toString()}`)
      .then((response) => response.json())
      .then((nextData) => {
        if (isMounted) {
          setData(nextData);
          setInspectionId(nextData.selectedInspectionId);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [site, windowValue, inspectionId]);

  if (!data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5" />;
  }

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Risk"
        title={data.title}
        description={data.description}
        action={
          <div className="flex flex-wrap gap-3">
            <DashboardSelect
              value={site}
              onChange={(value) => {
                setInspectionId(undefined);
                setSite(value);
              }}
              options={data.filters.sites.map((option) => ({
                label: option,
                value: option,
              }))}
            />
            <DashboardSelect
              value={windowValue}
              onChange={(value) => {
                setInspectionId(undefined);
                setWindowValue(value);
              }}
              options={data.filters.windows}
            />
          </div>
        }
      />

      <DashboardSection
        title="Upcoming inspections"
        description="Upcoming inspections and the likely level of attention they may need"
      >
        <DashboardDataTable
          columns={[
            {
              key: "type",
              header: "Type",
              render: (row) => (
                <span className="font-medium text-slate-900 dark:text-white">
                  {row.type}
                </span>
              ),
            },
            { key: "site", header: "Site", render: (row) => row.site },
            {
              key: "expectedDate",
              header: "Expected date",
              render: (row) => formatDate(row.expectedDate),
            },
            {
              key: "daysAway",
              header: "Days away",
              render: (row) => (
                <span
                  className={
                    row.daysAway <= 7
                      ? "font-semibold text-rose-600 dark:text-rose-300"
                      : "text-slate-700 dark:text-slate-200"
                  }
                >
                  {row.daysAway}
                </span>
              ),
            },
            {
              key: "riskLevel",
              header: "Risk level",
              render: (row) => (
                <DashboardBadge label={row.riskLevel} tone={riskTone(row.riskLevel)} />
              ),
            },
            {
              key: "action",
              header: "Action",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => setInspectionId(row.id)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-indigo-100 dark:bg-white/10 dark:text-white dark:hover:bg-indigo-500/20"
                >
                  View insights
                </button>
              ),
            },
          ]}
          rows={data.inspections}
        />
      </DashboardSection>

      <DashboardSection
        title={data.likelyFailureTitle}
        description={data.likelyFailureSubtitle}
      >
        <DashboardDataTable
          columns={[
            {
              key: "issue",
              header: "Issue",
              render: (row) => (
                <span className="font-medium text-slate-900 dark:text-white">
                  {row.issue}
                </span>
              ),
            },
            {
              key: "historicalFailCount",
              header: "Times seen before",
              render: (row) => row.historicalFailCount,
            },
            {
              key: "failureShare",
              header: "% of all issues",
              render: (row) => row.failureShare,
            },
            {
              key: "recurrenceLikelihood",
              header: "Chance of happening again",
              render: (row) => (
                <DashboardBadge
                  label={row.recurrenceLikelihood}
                  tone={
                    row.tone === "critical"
                      ? "critical"
                      : row.tone === "warning"
                        ? "warning"
                        : "success"
                  }
                />
              ),
            },
          ]}
          rows={data.likelyFailures}
        />
      </DashboardSection>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function riskTone(level: "High" | "Medium" | "Low") {
  if (level === "High") return "critical";
  if (level === "Medium") return "warning";
  return "success";
}
