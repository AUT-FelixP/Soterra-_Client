"use client";

import { useEffect, useState } from "react";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import { getExtractionFileState, type ExtractionFileState } from "@/lib/extractionFiles";
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
  const [fileState, setFileState] = useState<ExtractionFileState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      setLoading(true);
      const reportsResponse = await fetch("/api/reports", { cache: "no-store" });
      const reportsPayload = await reportsResponse.json();
      const nextFileState = getExtractionFileState(reportsPayload);

      if (!nextFileState.hasFiles) {
        if (isMounted) {
          setFileState(nextFileState);
          setData(null);
          setLoading(false);
        }
        return;
      }

      const response = await fetch(`/api/dashboard/insights?inspectionType=${encodeURIComponent(inspectionType)}`, {
        cache: "no-store",
      });
      const nextData = await response.json();

      if (isMounted) {
        setFileState(nextFileState);
        setData(nextData);
        setLoading(false);
      }
    }

    loadPage().catch(() => {
      if (isMounted) {
        setFileState({ hasFiles: false, fileCount: 0, extractedIssueCount: 0 });
        setData(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [inspectionType]);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white/5" />;
  }

  if (!fileState?.hasFiles || !data) {
    return <NoInsightsDataState />;
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

function NoInsightsDataState() {
  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Insights"
        title="No extraction insights available"
        description="Insights are generated directly from uploaded inspection files. Upload files to see root causes, risk areas, and repeated patterns."
      />

      <DashboardSection
        title="Insights waiting for files"
        description="Deleted files are no longer used, so stale insight data is hidden."
      >
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-white/10 dark:bg-slate-950/55">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No uploaded files were found.
          </p>
          <p className="mt-2 text-sm/6 text-slate-600 dark:text-slate-300">
            Upload inspection files to rebuild insights from the extraction data.
          </p>
        </div>
      </DashboardSection>
    </div>
  );
}
