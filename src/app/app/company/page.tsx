"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardCompanyResponse } from "@/lib/dashboardAppData";
import {
  DashboardBarChart,
  DashboardDataTable,
  DashboardMetricGrid,
  DashboardPageIntro,
  DashboardSection,
  DashboardSubCard,
  DashboardTwoColumn,
} from "../components/dashboard-ui";

export default function CompanyPage() {
  const [data, setData] = useState<DashboardCompanyResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/dashboard/company")
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
  }, []);

  if (!data) {
    return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;
  }

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Company"
        title={data.title}
        description={data.description}
      />

      <DashboardMetricGrid items={data.metrics} />

      <DashboardSection
        title="Performance by project"
        description="Select a project to drill into detail"
      >
        <DashboardDataTable
          columns={[
            {
              key: "project",
              header: "Project",
              render: (row) => (
                <Link
                  href={`/app/company/${row.slug}`}
                  className="font-semibold text-indigo-700 transition hover:text-indigo-900 dark:text-indigo-200 dark:hover:text-white"
                >
                  {row.name}
                </Link>
              ),
            },
            {
              key: "inspections",
              header: "Inspections",
              render: (row) => row.inspections,
            },
            {
              key: "failureRate",
              header: "Failure rate",
              render: (row) => row.failureRate,
            },
            {
              key: "reinspectionRate",
              header: "Reinspection %",
              render: (row) => row.reinspectionRate,
            },
            {
              key: "issuesPerInspection",
              header: "Issues / inspection",
              render: (row) => row.issuesPerInspection,
            },
          ]}
          rows={data.projects}
        />
      </DashboardSection>

      <DashboardTwoColumn>
        <DashboardSection
          title="Failure rate trend"
          description="Monthly failure rate (%)"
        >
          <DashboardBarChart data={data.failureTrend} />
        </DashboardSection>

        <DashboardSection
          title="Issues per inspection trend"
          description="Monthly average"
        >
          <DashboardBarChart data={data.issuesTrend} colorClassName="bg-cyan-300" />
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardSection
        title="Performance by inspection type"
        description="Inspection type comparison across the company portfolio"
      >
        <DashboardDataTable
          columns={[
            {
              key: "type",
              header: "Type",
              render: (row) => (
                <span className="font-medium text-slate-900 dark:text-white">{row.type}</span>
              ),
            },
            {
              key: "inspections",
              header: "Inspections",
              render: (row) => row.inspections,
            },
            {
              key: "failureRate",
              header: "Failure rate",
              render: (row) => (
                <span className={toneClass(row.tone)}>{row.failureRate}</span>
              ),
            },
            {
              key: "reinspectionRate",
              header: "Reinspection %",
              render: (row) => row.reinspectionRate,
            },
            {
              key: "issuesPerInspection",
              header: "Issues / inspection",
              render: (row) => row.issuesPerInspection,
            },
          ]}
          rows={data.inspectionTypes}
        />
      </DashboardSection>

      <DashboardSection
        title="Before vs after Soterra"
        description="Improvement since platform adoption"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {data.adoptionImpact.map((item) => (
            <DashboardSubCard key={item.label} title={item.label}>
              <p className={impactTone(item.tone)}>{item.value}</p>
            </DashboardSubCard>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}

function toneClass(tone?: "default" | "critical" | "warning" | "success") {
  if (tone === "critical") return "font-semibold text-rose-300";
  if (tone === "success") return "font-semibold text-emerald-300";
  if (tone === "warning") return "font-semibold text-amber-300";
  return "text-slate-700 dark:text-slate-200";
}

function impactTone(tone?: "critical" | "success") {
  if (tone === "critical") return "text-4xl font-semibold tracking-tight text-rose-600 dark:text-rose-300";
  if (tone === "success") return "text-4xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-300";
  return "text-4xl font-semibold tracking-tight text-slate-900 dark:text-white";
}
