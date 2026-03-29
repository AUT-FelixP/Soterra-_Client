"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

type DashboardMetric = {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  href: string;
  description: string;
};

type LiveTrackerSummary = {
  openIssues: number;
  overdue: number;
  readyForInspection: number;
  href: string;
  description: string;
};

type UpcomingInspectionRisk = {
  title: string;
  daysUntilInspection: number;
  likelyFailures: string[];
  href: string;
  description: string;
};

type TopFailureDriver = {
  issue: string;
  failCount: number;
  failureShare: number;
  inspections: number;
  reinspectionRate: number;
};

type DistributionItem = {
  label: string;
  percentage: number;
};

type TopFailuresSection = {
  inspectionTypes: string[];
  selectedInspectionType: string;
  summary: Array<{
    label: string;
    value: string;
  }>;
  performanceTrend: {
    label: string;
    dataPoints: Array<{
      label: string;
      value: number;
    }>;
    description: string;
  };
  drivers: TopFailureDriver[];
  failureDistribution: DistributionItem[];
  recurringRisk: DistributionItem[];
  inspectionReadiness: {
    calledEarlyPercentage: number;
    description: string;
  };
  closeOutPerformance: {
    averageDaysToClose: number;
    needsReinspectionPercentage: number;
  };
};

type InsightsPreview = {
  rootCauses: string[];
  highRiskAreas: string[];
  href: string;
  description: string;
};

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [topFailuresLoading, setTopFailuresLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardMetric[]>([]);
  const [liveTracker, setLiveTracker] = useState<LiveTrackerSummary | null>(null);
  const [upcomingRisk, setUpcomingRisk] =
    useState<UpcomingInspectionRisk | null>(null);
  const [topFailures, setTopFailures] = useState<TopFailuresSection | null>(null);
  const [insightsPreview, setInsightsPreview] =
    useState<InsightsPreview | null>(null);
  const [selectedInspectionType, setSelectedInspectionType] =
    useState("Hydraulic");
  const [inspectionTypeQuery, setInspectionTypeQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        // Each endpoint represents one backend contract, which keeps the UI
        // easy to connect once the real API is available.
        const [
          overviewResponse,
          liveTrackerResponse,
          upcomingRiskResponse,
          insightsPreviewResponse,
        ] = await Promise.all([
          fetch("/api/dashboard/overview"),
          fetch("/api/dashboard/live-tracker"),
          fetch("/api/dashboard/upcoming-risk"),
          fetch("/api/dashboard/insights-preview"),
        ]);

        const [
          overviewData,
          liveTrackerData,
          upcomingRiskData,
          insightsPreviewData,
        ] = await Promise.all([
          overviewResponse.json(),
          liveTrackerResponse.json(),
          upcomingRiskResponse.json(),
          insightsPreviewResponse.json(),
        ]);

        if (!isMounted) {
          return;
        }

        setOverview(Array.isArray(overviewData?.items) ? overviewData.items : []);
        setLiveTracker(liveTrackerData ?? null);
        setUpcomingRisk(upcomingRiskData ?? null);
        setInsightsPreview(insightsPreviewData ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setOverview([]);
        setLiveTracker(null);
        setUpcomingRisk(null);
        setInsightsPreview(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTopFailures() {
      setTopFailuresLoading(true);

      try {
        const response = await fetch(
          `/api/dashboard/top-failures?inspectionType=${encodeURIComponent(
            selectedInspectionType
          )}`
        );
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        setTopFailures(data ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setTopFailures(null);
      } finally {
        if (isMounted) {
          setTopFailuresLoading(false);
        }
      }
    }

    loadTopFailures();

    return () => {
      isMounted = false;
    };
  }, [selectedInspectionType]);

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-gray-800 px-6 py-8 shadow-sm dark:bg-gray-800/70">
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Construction Quality Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-gray-300">
          Monitor inspections, active issues, and the areas that need attention first.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            title="Overview"
            description=""
            helpText="Use these summary metrics to quickly understand inspection volume, issue levels, and whether repeat inspections are increasing."
          />
          {!loading && overview.length > 0 ? (
            <div className="sm:shrink-0">
              <ViewLink href={overview[0].href} label="View details" />
            </div>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <LoadingCard key={`overview-skeleton-${index}`} />
              ))
            : overview.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <SectionHeading
            title="Active Issue Tracker"
            description=""
            helpText="View the current status of live quality issues across the project."
          />
          <DashboardPanel>
            {loading || !liveTracker ? (
              <CardSkeleton rows={3} />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <TrackerStat
                    label="Open issues"
                    value={liveTracker.openIssues}
                    description=""
                  />
                  <TrackerStat
                    label="Overdue Actions"
                    value={liveTracker.overdue}
                    description=""
                  />
                  <TrackerStat
                    label="Ready for inspection"
                    value={liveTracker.readyForInspection}
                    description=""
                  />
                </div>
                <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                  <ViewLink href={liveTracker.href} label="Open tracker" />
                </div>
              </div>
            )}
          </DashboardPanel>
        </section>

        <section className="space-y-4">
          <SectionHeading
            title="Upcoming Inspection Risk"
            description=""
            helpText="Use this panel to prepare teams before inspection and reduce avoidable failures."
          />
          <DashboardPanel>
            {loading || !upcomingRisk ? (
              <CardSkeleton rows={4} />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                      Next High-Risk Inspection
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                      {upcomingRisk.title}
                    </h3>
                  </div>
                  <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 dark:bg-white/10 dark:text-white">
                    {upcomingRisk.daysUntilInspection} days
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/70">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Items to Check Before Inspection
                  </p>
                  <ul className="mt-3 space-y-3">
                    {upcomingRisk.likelyFailures.map((failure) => (
                      <li
                        key={failure}
                        className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-300"
                      >
                        <span className="size-2 rounded-full bg-gray-800 dark:bg-gray-200" />
                        {failure}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                  <ViewLink href={upcomingRisk.href} label="Review risk" />
                </div>
              </div>
            )}
          </DashboardPanel>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            title="Quality Summary"
            description=""
            helpText="This section summarizes current quality patterns for the selected inspection type using mock API data until the fuller performance area is built."
          />
          {!topFailuresLoading && topFailures ? (
            <InspectionTypePicker
              inspectionTypes={topFailures.inspectionTypes}
              selectedInspectionType={selectedInspectionType}
              query={inspectionTypeQuery}
              onQueryChange={setInspectionTypeQuery}
              onChange={(inspectionType) => {
                setInspectionTypeQuery("");
                if (inspectionType) {
                  setSelectedInspectionType(inspectionType);
                }
              }}
            />
          ) : null}
        </div>

        <DashboardPanel>
          {loading || topFailuresLoading || !topFailures ? (
            <CardSkeleton rows={6} />
          ) : (
            <div className="space-y-8">
              <div className="grid gap-4 border-b border-gray-200 pb-6 sm:grid-cols-2 xl:grid-cols-4 dark:border-white/10">
                {topFailures.summary.map((item) => (
                  <SummaryTile
                    key={item.label}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <SubCard
                    title="Quality Performance Trend"
                    description={topFailures.performanceTrend.description}
                  >
                    <TrendChart dataPoints={topFailures.performanceTrend.dataPoints} />
                    <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                      {topFailures.performanceTrend.label}
                    </p>
                  </SubCard>

                  <SubCard
                    title="Top Failure Drivers"
                    description="The most common issues contributing to failed inspections."
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                        <thead className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                          <tr>
                            <th className="px-0 py-3 pr-4">Issue Type</th>
                            <th className="px-0 py-3 pr-4">Number of Failures</th>
                            <th className="px-0 py-3 pr-4">Share of Total Failures</th>
                            <th className="px-0 py-3 pr-4">Inspections Affected</th>
                            <th className="px-0 py-3">Reinspection rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                          {topFailures.drivers.map((driver) => (
                            <tr key={driver.issue}>
                              <td className="px-0 py-4 pr-4 text-sm font-medium text-gray-900 dark:text-white">
                                {driver.issue}
                              </td>
                              <td className="px-0 py-4 pr-4 text-sm text-gray-500 dark:text-gray-300">
                                {driver.failCount}
                              </td>
                              <td className="px-0 py-4 pr-4 text-sm text-gray-500 dark:text-gray-300">
                                {driver.failureShare}%
                              </td>
                              <td className="px-0 py-4 pr-4 text-sm text-gray-500 dark:text-gray-300">
                                {driver.inspections}
                              </td>
                              <td className="px-0 py-4 text-sm text-gray-500 dark:text-gray-300">
                                {driver.reinspectionRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SubCard>
                </div>

                <div className="space-y-6">
                  <SubCard
                    title="Failure Breakdown"
                    description="Shows how total failures are distributed across issue types."
                  >
                    <BarList items={topFailures.failureDistribution} />
                  </SubCard>

                  <SubCard
                    title="Recurring Risk Forecast"
                    description="Predicts which issue types are most likely to appear again based on past inspection results."
                  >
                    <BarList items={topFailures.recurringRisk} />
                  </SubCard>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <SubCard title="Inspection Readiness">
                      <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                        {topFailures.inspectionReadiness.calledEarlyPercentage}%
                      </p>
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
                        Inspections Requested Too Early
                      </p>
                    </SubCard>

                    <SubCard title="Issue Close-Out Performance">
                      <div className="space-y-4">
                        <div>
                          <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                            {topFailures.closeOutPerformance.averageDaysToClose}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                            Average Days to Close Issues
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {
                              topFailures.closeOutPerformance
                                .needsReinspectionPercentage
                            }
                            %
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                            Items Requiring Reinspection
                          </p>
                        </div>
                      </div>
                    </SubCard>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DashboardPanel>
      </section>

      <section className="space-y-4">
          <SectionHeading
            title="Key Insights"
            description=""
            helpText="This summary helps supervisors and managers focus on the issues and locations creating the most quality risk."
          />
        <DashboardPanel>
          {loading || !insightsPreview ? (
            <CardSkeleton rows={4} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
              <InsightList
                title="Main Root Causes"
                description="The most common reasons inspections are failing."
                items={insightsPreview.rootCauses}
              />
              <InsightList
                title="High-Risk Work Areas"
                description="Locations or work zones where issues are appearing more often."
                items={insightsPreview.highRiskAreas}
              />
              <div className="lg:justify-self-end">
                <div className="mt-4">
                  <ViewLink href={insightsPreview.href} label="Open insights" />
                </div>
              </div>
            </div>
          )}
        </DashboardPanel>
      </section>
    </div>
  );
}

function SectionHeading(props: {
  title: string;
  description: string;
  helpText: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {props.title}
        </h2>
        <HelpHint text={props.helpText} />
      </div>
      {props.description ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
          {props.description}
        </p>
      ) : null}
    </div>
  );
}

function HelpHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Section help"
        className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <InformationCircleIcon aria-hidden="true" className="size-5" />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium leading-5 text-white shadow-lg group-hover:block dark:bg-gray-700">
        {text}
      </span>
    </span>
  );
}

function InspectionTypePicker(props: {
  inspectionTypes: string[];
  selectedInspectionType: string;
  query: string;
  onQueryChange: (value: string) => void;
  onChange: (value: string | null) => void;
}) {
  const filteredInspectionTypes =
    props.query === ""
      ? props.inspectionTypes
      : props.inspectionTypes.filter((inspectionType) =>
          inspectionType.toLowerCase().includes(props.query.toLowerCase())
        );

  return (
    <Combobox value={props.selectedInspectionType} onChange={props.onChange}>
      <Label className="block text-sm font-medium text-gray-900 dark:text-white">
        Inspection type
      </Label>
      <div className="relative mt-2 w-full sm:w-64">
        <ComboboxInput
          className="block w-full rounded-full bg-white py-2 pr-12 pl-4 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 outline-none placeholder:text-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-[#6D5EF5] dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:placeholder:text-gray-500"
          onChange={(event) => props.onQueryChange(event.target.value)}
          onBlur={() => props.onQueryChange("")}
          displayValue={(inspectionType: string) => inspectionType}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-full px-3 focus:outline-hidden">
          <ChevronDownIcon className="size-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        <ComboboxOptions
          transition
          className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white py-2 shadow-lg outline outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
        >
          {filteredInspectionTypes.map((inspectionType) => (
            <ComboboxOption
              key={inspectionType}
              value={inspectionType}
              className="cursor-default px-4 py-2 text-sm font-medium text-gray-900 select-none data-focus:bg-[#6D5EF5] data-focus:text-white data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-[#6D5EF5]"
            >
              <span className="block truncate">{inspectionType}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

function DashboardPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white px-5 py-6 shadow-sm outline-1 outline-black/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 sm:px-6">
      {children}
    </div>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-lg bg-white px-5 py-5 shadow-sm outline-1 outline-black/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {metric.label}
        </p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {formatMetricValue(metric.value, metric.suffix)}
      </p>
      </div>
      {metric.description ? (
        <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-300">
          {metric.description}
        </p>
      ) : null}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-lg bg-white px-5 py-5 shadow-sm outline-1 outline-black/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-10 w-28 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}

function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`skeleton-row-${index}`}
          className="h-5 rounded bg-gray-200 dark:bg-white/10"
        />
      ))}
    </div>
  );
}

function ViewLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#6D5EF5] px-3 py-1.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#5f51e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5] dark:bg-[#6D5EF5] dark:shadow-none dark:hover:bg-[#7a6bff] dark:focus-visible:outline-[#6D5EF5]"
    >
      {label}
    </Link>
  );
}

function TrackerStat(props: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-4 dark:bg-gray-900/70">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {props.label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
        {props.value}
      </p>
      {props.description ? (
        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-300">
          {props.description}
        </p>
      ) : null}
    </div>
  );
}

function SubCard(props: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-5 dark:bg-gray-900/70">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {props.title}
      </h3>
      {props.description ? (
        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-300">
          {props.description}
        </p>
      ) : null}
      <div className="mt-5">{props.children}</div>
    </div>
  );
}

function SummaryTile(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-4 dark:bg-gray-900/70">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
        {props.label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
        {props.value}
      </p>
    </div>
  );
}

function TrendChart({
  dataPoints,
}: {
  dataPoints: Array<{ label: string; value: number }>;
}) {
  const maxValue = Math.max(...dataPoints.map((point) => point.value), 1);

  return (
    <div className="rounded-lg bg-white p-4 shadow-xs inset-ring inset-ring-gray-200 dark:bg-gray-800 dark:shadow-none dark:inset-ring-white/10">
      <div className="flex h-36 items-end gap-3">
      {dataPoints.map((point, index) => (
        <div key={`${point}-${index}`} className="flex flex-1 flex-col items-center">
          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {point.value}%
          </div>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg bg-gray-800 dark:bg-gray-200"
              style={{ height: `${(point.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-3">
        {dataPoints.map((point) => (
          <p
            key={point.label}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {point.label}
          </p>
        ))}
      </div>
    </div>
  );
}

function BarList({ items }: { items: DistributionItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              {item.label}
            </span>
            <span className="text-gray-500 dark:text-gray-300">
              {item.percentage}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 dark:bg-white/10">
            <div
              className="h-3 rounded-full bg-gray-800 dark:bg-gray-200"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function InsightList(props: {
  title: string;
  description?: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-5 dark:bg-gray-900/70">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {props.title}
      </h3>
      {props.description ? (
        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-300">
          {props.description}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {props.items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-300"
          >
            <span className="size-2 rounded-full bg-gray-800 dark:bg-gray-200" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatMetricValue(value: number, suffix?: string) {
  const formattedValue = Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toFixed(1);

  return suffix ? `${formattedValue}${suffix}` : formattedValue;
}
