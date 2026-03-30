"use client";

import { useEffect, useState } from "react";
import type { DashboardOverviewResponse } from "@/lib/dashboardAppData";
import {
  DashboardBadge,
  DashboardBarChart,
  DashboardBulletList,
  DashboardButtonLink,
  DashboardDataTable,
  DashboardHighlight,
  DashboardListBars,
  DashboardMetricGrid,
  DashboardPageIntro,
  DashboardSection,
  DashboardSubCard,
  DashboardTwoColumn,
} from "./components/dashboard-ui";

export default function OverviewPage() {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      const response = await fetch("/api/dashboard");
      const nextData = await response.json();

      if (isMounted) {
        setData(nextData);
      }
    }

    loadPage().catch(() => {
      if (isMounted) {
        setData(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!data) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Overview"
        title={data.title}
        description={data.description}
      />

      <DashboardMetricGrid items={data.metrics} />

      <DashboardHighlight
        label="Live tracker"
        action={<DashboardButtonLink href={data.liveTracker.href} label="Open tracker" />}
      >
        Open issues:{" "}
        <strong className="text-rose-200">{data.liveTracker.openIssues}</strong>
        {"  ·  "}
        Overdue: <strong className="text-rose-200">{data.liveTracker.overdue}</strong>
        {"  ·  "}
        Ready for inspection:{" "}
        <strong className="text-emerald-200">
          {data.liveTracker.readyForInspection}
        </strong>
      </DashboardHighlight>

      <DashboardTwoColumn>
        <DashboardSection
          title="Performance trend"
          description="Monthly failure rate (%)"
        >
          <DashboardBarChart data={data.performanceTrend} />
        </DashboardSection>

        <DashboardSection
          title="Upcoming inspection risk"
          description="Next inspections most likely to fail first time"
        >
          <div className="space-y-4">
            {data.upcomingRisks.map((risk) => (
              <div
                key={risk.title}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{risk.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{risk.subtitle}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
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
        title="Top failure drivers"
        description="Most common issues across all inspections"
      >
        <DashboardDataTable
          columns={[
            {
              key: "issue",
              header: "Issue",
              render: (row) => <span className="font-medium text-white">{row.issue}</span>,
            },
            {
              key: "count",
              header: "Fail count",
              render: (row) => row.failCount,
            },
            {
              key: "share",
              header: "% of failures",
              render: (row) => row.failureShare,
            },
            {
              key: "inspections",
              header: "Inspections",
              render: (row) => row.inspections,
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

      <DashboardTwoColumn>
        <DashboardSection
          title="Failure distribution"
          description="Share of total failures by type"
        >
          <DashboardListBars items={data.failureDistribution} />
        </DashboardSection>

        <DashboardSection
          title="Recurring risk — predictive"
          description="Likelihood of reappearing once identified"
        >
          <DashboardListBars items={data.recurringRisk} />
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardTwoColumn>
        <DashboardSection
          title="Inspection readiness"
          description="Inspections called before work complete"
        >
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-5 py-6">
            <p className="text-5xl font-semibold tracking-tight text-amber-200">
              {data.inspectionReadiness.value}
            </p>
            <p className="mt-3 max-w-sm text-sm text-slate-300">
              {data.inspectionReadiness.description}
            </p>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Close-out performance"
          description="How quickly issues are resolved"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {data.closeOutPerformance.map((item) => (
              <DashboardSubCard key={item.label} title={item.label}>
                <p className="text-4xl font-semibold tracking-tight text-white">
                  {item.value}
                </p>
              </DashboardSubCard>
            ))}
          </div>
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardSection
        title="Key observations"
        description="Immediate takeaways for the current dashboard state"
      >
        <DashboardBulletList
          items={[
            "Hydraulic inspections continue to drive the highest first-time failure rate.",
            "Pipe penetrations and pipe supports remain the most common repeat defects.",
            "Inspection readiness is still the clearest lever for reducing reinspection volume.",
          ]}
        />
      </DashboardSection>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
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
