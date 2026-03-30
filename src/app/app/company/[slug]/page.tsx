"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardProjectResponse } from "@/lib/dashboardAppData";
import {
  DashboardBadge,
  DashboardButtonLink,
  DashboardDataTable,
  DashboardHighlight,
  DashboardMetricGrid,
  DashboardPageIntro,
  DashboardSection,
  DashboardSubCard,
  DashboardTwoColumn,
} from "../../components/dashboard-ui";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [data, setData] = useState<DashboardProjectResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    params.then(({ slug: nextSlug }) => {
      if (!isMounted) {
        return;
      }

      fetch(`/api/dashboard/project/${nextSlug}`)
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
    });

    return () => {
      isMounted = false;
    };
  }, [params]);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Project"
        title={data.title}
        description={data.description}
        action={
          <Link
            href="/app/company"
            className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-900 dark:text-indigo-200 dark:hover:text-white"
          >
            Back to company
          </Link>
        }
      />

      <DashboardMetricGrid items={data.metrics} />

      <DashboardHighlight
        label="Live tracker — this project"
        action={<DashboardButtonLink href={data.trackerSnapshot.href} label="Open tracker" />}
      >
        Open: <strong className="text-rose-200">{data.trackerSnapshot.open}</strong>
        {"  ·  "}
        Ready: <strong className="text-amber-200">{data.trackerSnapshot.ready}</strong>
        {"  ·  "}
        Closed (7d):{" "}
        <strong className="text-emerald-200">
          {data.trackerSnapshot.closedLast7Days}
        </strong>
      </DashboardHighlight>

      <DashboardSection title="Open items by type">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.openItemsByType.map((item) => (
            <DashboardSubCard key={item.label} title={item.label}>
              <p className="text-4xl font-semibold tracking-tight text-white">
                {item.value}
              </p>
            </DashboardSubCard>
          ))}
        </div>
      </DashboardSection>

      <DashboardTwoColumn>
        <DashboardSection title="Top failure drivers">
          <DashboardDataTable
            columns={[
              {
                key: "issue",
                header: "Issue",
                render: (row) => <span className="font-medium text-white">{row.issue}</span>,
              },
              { key: "count", header: "Count", render: (row) => row.count },
              {
                key: "share",
                header: "% of fails",
                render: (row) => row.failShare,
              },
            ]}
            rows={data.topFailureDrivers}
          />
        </DashboardSection>

        <DashboardSection title="Vs company average">
          <div className="space-y-4">
            {data.versusCompanyAverage.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4"
              >
                <p className="text-sm font-medium text-white">{item.label}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className={comparisonTone(item.tone)}>{item.projectValue}</span>
                  <span className="text-slate-500 dark:text-slate-400">vs {item.companyValue} avg</span>
                  <DashboardBadge label={item.deltaLabel} tone={item.tone === "critical" ? "critical" : "neutral"} />
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardSection title="Recent failed items">
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
            { key: "type", header: "Type", render: (row) => row.type },
            { key: "date", header: "Date", render: (row) => row.date },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <DashboardBadge
                  label={row.status}
                  tone={row.status === "Open" ? "critical" : row.status === "Ready" ? "warning" : "success"}
                />
              ),
            },
          ]}
          rows={data.recentFailedItems}
        />
      </DashboardSection>
    </div>
  );
}

function comparisonTone(tone?: "critical" | "warning" | "success") {
  if (tone === "critical") return "font-semibold text-rose-600 dark:text-rose-300";
  if (tone === "warning") return "font-semibold text-amber-600 dark:text-amber-300";
  if (tone === "success") return "font-semibold text-emerald-600 dark:text-emerald-300";
  return "font-semibold text-slate-900 dark:text-white";
}
