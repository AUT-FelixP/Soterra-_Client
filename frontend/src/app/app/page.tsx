"use client";

import { useEffect, useState } from "react";
import type { DashboardOverviewResponse } from "@/lib/dashboardAppData";
import { getExtractionFileState, type ExtractionFileState } from "@/lib/extractionFiles";
import {
  DashboardBadge,
  DashboardBarChart,
  DashboardButtonLink,
  DashboardDataTable,
  DashboardHighlight,
  DashboardMetricGrid,
  DashboardPageIntro,
  DashboardSection,
  DashboardSubCard,
  DashboardTwoColumn,
} from "./components/dashboard-ui";

export default function OverviewPage() {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
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

      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const nextData = await response.json();

      if (isMounted) {
        setFileState(nextFileState);
        setData(nextData);
        setLoading(false);
      }
    }

    loadPage().catch(() => {
      if (isMounted) {
        setData(null);
        setFileState({ hasFiles: false, fileCount: 0, extractedIssueCount: 0 });
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <DashboardLoadingState />;
  }

  if (!fileState?.hasFiles || !data) {
    return <NoExtractionDataState />;
  }

  const issueStatusSummary = data.issueStatusSummary ?? [
    { label: "Open", value: String(data.liveTracker.openIssues) },
    { label: "Ready", value: String(data.liveTracker.readyForInspection) },
    { label: "Closed", value: "0" },
    { label: "Avg days to close", value: "0" },
  ];
  const overviewMetrics = data.metrics.filter(
    (metric) => metric.label.toLowerCase() !== "issues / inspection"
  );

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Overview"
        title={data.title}
        description={data.description}
      />

      <DashboardMetricGrid items={overviewMetrics} />

      <DashboardHighlight
        label="Live tracker"
        action={<DashboardButtonLink href={data.liveTracker.href} label="Open tracker" />}
      >
        Open issues:{" "}
        <strong className="text-rose-600 dark:text-rose-200">
          {data.liveTracker.openIssues}
        </strong>
        {"  |  "}
        Overdue:{" "}
        <strong className="text-rose-600 dark:text-rose-200">
          {data.liveTracker.overdue}
        </strong>
        {"  |  "}
        Ready for inspection:{" "}
        <strong className="text-emerald-600 dark:text-emerald-200">
          {data.liveTracker.readyForInspection}
        </strong>
      </DashboardHighlight>

      <DashboardTwoColumn>
        <DashboardSection
          title="Performance trend"
          description="Issues found each month"
        >
          <DashboardBarChart data={data.performanceTrend} />
        </DashboardSection>

        <DashboardSection
          title="Upcoming inspection risk"
          description="Inspections that may need extra attention soon"
        >
          <div className="space-y-4">
            {data.upcomingRisks.map((risk) => (
              <div
                key={risk.title}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-white/10 dark:bg-slate-950/55"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {risk.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {risk.subtitle}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {risk.daysAway} days
                  </p>
                  <DashboardBadge label={risk.level} tone={riskTone(risk.level)} />
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardSection
        title="Most common issues"
        description="The issues that appear most often across all reports"
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
              key: "count",
              header: "Times found",
              render: (row) => row.failCount,
            },
            {
              key: "share",
              header: "% of all issues",
              render: (row) => row.failureShare,
            },
            {
              key: "inspections",
              header: "Inspections",
              render: (row) => row.inspections,
            },
          ]}
          rows={data.topFailureDrivers}
        />
      </DashboardSection>

      <DashboardSection
        title="Issue status summary"
        description="A quick view of where current issues stand"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {issueStatusSummary.map((item) => (
            <DashboardSubCard key={item.label} title={item.label}>
              <p className="text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-white">
                {item.value}
              </p>
            </DashboardSubCard>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}

function NoExtractionDataState() {
  return (
    <div className="space-y-6">
      <DashboardPageIntro
        eyebrow="Overview"
        title="No extraction data available"
        description="Upload inspection files in Reports or Repository to generate dashboard metrics from extracted data."
      />
      <DashboardSection
        title="Dashboard waiting for files"
        description="Metrics, issue trends, risk, and common failures will appear here after uploaded files have extraction results."
      >
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-white/10 dark:bg-slate-950/55">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No uploaded files were found.
          </p>
          <p className="mt-2 text-sm/6 text-slate-600 dark:text-slate-300">
            Deleted files are no longer counted, so stale dashboard metrics are hidden.
          </p>
        </div>
      </DashboardSection>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </div>
  );
}

function riskTone(level: "High" | "Medium" | "Low") {
  if (level === "High") return "critical";
  if (level === "Medium") return "warning";
  return "success";
}
