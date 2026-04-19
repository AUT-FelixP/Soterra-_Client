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
        title="Most common issues"
        description="The issues that appear most often in these reports"
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
              render: (row) => (
                <span className="font-medium text-slate-900 dark:text-white">
                  {row.issue}
                </span>
              ),
            },
            { key: "count", header: "Times found", render: (row) => row.failCount },
            {
              key: "share",
              header: "% of all issues",
              render: (row) => row.failureShare,
            },
            {
              key: "affected",
              header: "Inspections affected",
              render: (row) => row.inspectionsAffected,
            },
          ]}
          rows={data.topFailureDrivers}
        />
      </DashboardSection>

      <DashboardSection
        title="Repeated issues"
        description="Issues that keep showing up across multiple reports"
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
              key: "likelihood",
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
            {
              key: "repeatCount",
              header: "Times found",
              render: (row) => row.repeatCount ?? "0",
            },
            {
              key: "inspectionsAffected",
              header: "Inspections affected",
              render: (row) => row.inspectionsAffected ?? "Unknown",
            },
          ]}
          rows={data.recurringRisks}
        />
      </DashboardSection>
    </div>
  );
}
