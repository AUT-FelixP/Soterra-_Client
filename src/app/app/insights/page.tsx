"use client";

import { useEffect, useState } from "react";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import {
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
          description="Why inspections fail first time"
        >
          <DashboardBulletList items={data.rootCauses} />
        </DashboardSection>

        <DashboardSection
          title="High risk areas"
          description="Locations where failures concentrate"
        >
          <DashboardBulletList items={data.highRiskAreas} />
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardSection
        title="Repeated problem patterns"
        description="Issues appearing across multiple inspections"
      >
        <DashboardDataTable
          columns={[
            {
              key: "issue",
              header: "Issue",
              render: (row) => <span className="font-medium text-white">{row.issue}</span>,
            },
            {
              key: "occurrence",
              header: "Occurrence across inspections",
              render: (row) => row.occurrence,
            },
            {
              key: "trend",
              header: "Trend",
              render: (row) => (
                <span className={trendTone(row.trend)}>
                  {trendIcon(row.trend)} {row.trend}
                </span>
              ),
            },
          ]}
          rows={data.repeatedPatterns}
        />
      </DashboardSection>
    </div>
  );
}

function trendTone(trend: "Increasing" | "Stable" | "Improving") {
  if (trend === "Increasing") return "font-semibold text-rose-300";
  if (trend === "Stable") return "font-semibold text-amber-300";
  return "font-semibold text-emerald-300";
}

function trendIcon(trend: "Increasing" | "Stable" | "Improving") {
  if (trend === "Increasing") return "↑";
  if (trend === "Stable") return "→";
  return "↓";
}
