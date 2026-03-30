"use client";

import { useEffect, useState } from "react";
import type { DashboardPerformanceResponse } from "@/lib/dashboardAppData";
import {
  DashboardBadge,
  DashboardButtonLink,
  DashboardDataTable,
  DashboardPageIntro,
  DashboardSection,
  DashboardSelect,
} from "../components/dashboard-ui";

export default function PerformancePage() {
  const [inspectionType, setInspectionType] = useState("All types");
  const [data, setData] = useState<DashboardPerformanceResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/dashboard/performance?inspectionType=${encodeURIComponent(inspectionType)}`)
      .then((response) => response.json())
      .then((nextData) => {
        if (isMounted) {
          setData(nextData);
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
  }, [inspectionType]);

  if (!data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />;
  }

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Performance"
        title={data.title}
        description={data.description}
      />

      <DashboardSection
        title="Top failure drivers — full list"
        description="All failure types ranked by occurrence"
        action={
          <div className="flex flex-wrap gap-3">
            <DashboardSelect
              value={inspectionType}
              onChange={setInspectionType}
              options={data.filter.options.map((option) => ({
                label: option,
                value: option,
              }))}
            />
            <DashboardButtonLink href="/app/insights" label="Open insights" />
          </div>
        }
      >
        <DashboardDataTable
          columns={[
            { key: "rank", header: "Rank", render: (row) => row.rank },
            {
              key: "issue",
              header: "Issue",
              render: (row) => <span className="font-medium text-white">{row.issue}</span>,
            },
            { key: "count", header: "Fail count", render: (row) => row.failCount },
            {
              key: "share",
              header: "% of failures",
              render: (row) => row.failureShare,
            },
            {
              key: "affected",
              header: "Inspections affected",
              render: (row) => row.inspectionsAffected,
            },
            {
              key: "reinspection",
              header: "Reinspection rate",
              render: (row) => row.reinspectionRate,
            },
          ]}
          rows={data.topFailureDrivers}
        />
      </DashboardSection>

      <DashboardSection
        title="Recurring risks — predictive"
        description="Likelihood of reappearing once first identified"
      >
        <DashboardDataTable
          columns={[
            {
              key: "issue",
              header: "Issue",
              render: (row) => <span className="font-medium text-white">{row.issue}</span>,
            },
            {
              key: "likelihood",
              header: "Recurrence likelihood",
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
            {
              key: "repeatInstances",
              header: "Repeat instances",
              render: (row) => row.repeatInstances,
            },
            {
              key: "effect",
              header: "Early close-out effect",
              render: (row) => row.earlyCloseOutEffect,
            },
          ]}
          rows={data.recurringRisks}
        />

        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 text-sm text-slate-300">
          {data.recurrenceSummary}
        </div>
      </DashboardSection>
    </div>
  );
}
