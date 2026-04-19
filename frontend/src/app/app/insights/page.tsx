"use client";

import { useEffect, useState } from "react";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import {
  DashboardBadge,
  DashboardBulletList,
  DashboardDataTable,
  DashboardPageIntro,
  DashboardSection,
  DashboardSelect,
  DashboardTwoColumn,
} from "../components/dashboard-ui";

export default function InsightsPage() {
  const [inspectionType, setInspectionType] = useState("All inspection types");
  const [data, setData] = useState<DashboardInsightsResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/dashboard/insights?inspectionType=${encodeURIComponent(inspectionType)}`)
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
        eyebrow="Insights"
        title={data.title}
        description={data.description}
        action={
          <DashboardSelect
            value={inspectionType}
            onChange={setInspectionType}
            options={data.filter.options.map((option) => ({
              label: option,
              value: option,
            }))}
          />
        }
      />

      <DashboardTwoColumn>
        <DashboardSection
          title="Top root causes"
          description="The main types of problems being picked up"
        >
          <DashboardBulletList items={data.rootCauses} />
        </DashboardSection>

        <DashboardSection
          title="High risk areas"
          description="Areas where issues are showing up most often"
        >
          <DashboardBulletList items={data.highRiskAreas} />
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardSection
        title="Repeated problem patterns"
        description="Issues that are appearing across multiple reports"
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
              key: "occurrence",
              header: "% of all issues",
              render: (row) => row.occurrence,
            },
            {
              key: "inspectionsAffected",
              header: "Inspections affected",
              render: (row) => row.inspectionsAffected ?? "Unknown",
            },
            {
              key: "highestSeverity",
              header: "Highest severity",
              render: (row) => (
                <DashboardBadge
                  label={row.highestSeverity ?? "Unspecified"}
                  tone={
                    row.highestSeverity === "Critical" || row.highestSeverity === "High"
                      ? "critical"
                      : row.highestSeverity === "Medium"
                        ? "warning"
                        : "success"
                  }
                />
              ),
            },
          ]}
          rows={data.repeatedPatterns}
        />
      </DashboardSection>
    </div>
  );
}
