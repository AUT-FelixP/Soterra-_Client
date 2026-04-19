"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardCompanyResponse } from "@/lib/dashboardAppData";
import {
  DashboardDataTable,
  DashboardPageIntro,
  DashboardSection,
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

      <DashboardSection
        title="Performance by project"
        description="Compare projects by inspections, issues, and open items"
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
              key: "extractedIssues",
              header: "Issues found",
              render: (row) => row.extractedIssues,
            },
            {
              key: "openIssues",
              header: "Open issues",
              render: (row) => row.openIssues,
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

      <DashboardSection
        title="Performance by inspection type"
        description="See which inspection types are finding the most issues"
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
              key: "extractedIssues",
              header: "Issues found",
              render: (row) => (
                <span className={toneClass(row.tone)}>{row.extractedIssues}</span>
              ),
            },
            {
              key: "openIssues",
              header: "Open issues",
              render: (row) => row.openIssues,
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
    </div>
  );
}

function toneClass(tone?: "default" | "critical" | "warning" | "success") {
  if (tone === "critical") return "font-semibold text-rose-600 dark:text-rose-300";
  if (tone === "success") return "font-semibold text-emerald-600 dark:text-emerald-300";
  if (tone === "warning") return "font-semibold text-amber-600 dark:text-amber-300";
  return "text-slate-700 dark:text-slate-200";
}
