"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AiInspectionInsightsResponse,
  DashboardInsightsResponse,
  InsightGroupItem,
} from "@/lib/dashboardAppData";
import { getExtractionFileState, type ExtractionFileState } from "@/lib/extractionFiles";
import {
  DashboardBadge,
  DashboardBulletList,
  DashboardDataTable,
  DashboardPageIntro,
  DashboardSection,
  DashboardSelect,
  DashboardSubCard,
  DashboardTwoColumn,
} from "../components/dashboard-ui";

type PatternRow = DashboardInsightsResponse["repeatedPatterns"][number];
type PatternFilter = {
  type: "rootCause" | "highRiskArea";
  value: string;
  label: string;
} | null;

const defaultSortOptions = [
  { value: "frequency", label: "Frequency", field: "occurrenceCount", direction: "desc" as const },
  { value: "severity", label: "Severity", field: "severityRank", direction: "desc" as const },
  { value: "affectedInspections", label: "Affected inspections", field: "affectedInspectionCount", direction: "desc" as const },
  { value: "issue", label: "Issue", field: "issue", direction: "asc" as const },
];

export default function InsightsPage() {
  const [inspectionType, setInspectionType] = useState("All inspection types");
  const [insights, setInsights] = useState<DashboardInsightsResponse | null>(null);
  const [aiData, setAiData] = useState<AiInspectionInsightsResponse | null>(null);
  const [fileState, setFileState] = useState<ExtractionFileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("frequency");
  const [patternFilter, setPatternFilter] = useState<PatternFilter>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      if (hasLoadedRef.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const reportsResponse = await fetch("/api/reports", { cache: "no-store" });
      const reportsPayload = await reportsResponse.json();
      const nextFileState = getExtractionFileState(reportsPayload);

      if (!nextFileState.hasFiles) {
        if (isMounted) {
          setFileState(nextFileState);
          setInsights(null);
          setAiData(null);
          setLoading(false);
          setRefreshing(false);
          hasLoadedRef.current = true;
        }
        return;
      }

      const insightsUrl = `/api/dashboard/insights?inspectionType=${encodeURIComponent(inspectionType)}`;
      const aiInspectionType = inspectionType === "All inspection types" ? "All" : inspectionType;
      const aiUrl = `/api/dashboard/insights/ai?inspectionType=${encodeURIComponent(aiInspectionType)}`;
      const [insightsResponse, aiResponse] = await Promise.all([
        fetch(insightsUrl, { cache: "no-store" }),
        fetch(aiUrl, { cache: "no-store" }),
      ]);

      const nextInsights = await insightsResponse.json();
      const nextAiData = aiResponse.ok ? await aiResponse.json() : null;

      if (isMounted) {
        setFileState(nextFileState);
        setInsights(nextInsights);
        setAiData(nextAiData);
        setLoading(false);
        setRefreshing(false);
        hasLoadedRef.current = true;
        setPatternFilter(null);
      }
    }

    loadPage().catch(() => {
      if (isMounted) {
        setFileState({ hasFiles: false, fileCount: 0, extractedIssueCount: 0 });
        setInsights(null);
        setAiData(null);
        setLoading(false);
        setRefreshing(false);
        hasLoadedRef.current = true;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [inspectionType]);

  const rootCauseItems = useMemo(
    () => normaliseGroupItems(insights?.rootCauseItems, insights?.rootCauses, "rootCause"),
    [insights]
  );
  const highRiskAreaItems = useMemo(
    () => normaliseGroupItems(insights?.highRiskAreaItems, insights?.highRiskAreas, "highRiskArea"),
    [insights]
  );
  const aiPatternActions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of aiData?.repeatedPatterns ?? []) {
      if (row.issue && row.aiRecommendation) map.set(row.issue, row.aiRecommendation);
    }
    return map;
  }, [aiData]);
  const sortOptions = insights?.tableControls?.sortOptions?.length
    ? insights.tableControls.sortOptions
    : defaultSortOptions;

  const filteredPatterns = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedSort = sortOptions.find((option) => option.value === sortBy) ?? sortOptions[0];

    return [...(insights?.repeatedPatterns ?? [])]
      .filter((row) => patternMatchesFilter(row, patternFilter))
      .filter((row) => {
        if (!query) return true;
        return [
          row.issue,
          row.category,
          ...(row.categories ?? []),
          ...(row.locations ?? []),
          ...(row.relatedTrades ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => comparePatternRows(a, b, selectedSort.field, selectedSort.direction));
  }, [insights, patternFilter, search, sortBy, sortOptions]);

  const selectedGroup = useMemo(() => {
    if (!patternFilter) return null;
    const source = patternFilter.type === "rootCause" ? rootCauseItems : highRiskAreaItems;
    return source.find((item) => item.label === patternFilter.value) ?? null;
  }, [highRiskAreaItems, patternFilter, rootCauseItems]);

  if (loading) {
    return <InsightsLoadingState />;
  }

  if (!fileState?.hasFiles || !insights) {
    return <NoInsightsDataState />;
  }

  return (
    <div className="space-y-8 overflow-visible">
      <DashboardPageIntro
        eyebrow="Insights"
        title={insights.title}
        description={insights.description}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {refreshing ? <LoadingPill label="Updating insights" /> : null}
            <DashboardSelect
              value={inspectionType}
              onChange={setInspectionType}
              options={insights.filter.options.map((option) => ({
                label: option,
                value: option,
              }))}
            />
          </div>
        }
      />

      {aiData?.fallbackMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm/6 text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
          {aiData.fallbackMessage}
        </div>
      ) : null}

      <DashboardSection
        title="Executive Summary"
        description={aiData?.confidenceNote ?? "Generated from the inspection data currently loaded for this tenant."}
      >
        <DashboardBulletList
          items={
            aiData?.executiveSummary?.length
              ? aiData.executiveSummary
              : ["No AI summary is available yet. Use the root causes and repeated patterns below for deterministic insights."]
          }
        />
      </DashboardSection>

      <DashboardTwoColumn>
        <DashboardSection
          title="Root Causes"
          description="Click a cause to filter repeated patterns and reveal related reports."
        >
          <InsightGroupList
            items={rootCauseItems}
            activeFilter={patternFilter}
            filterType="rootCause"
            onSelect={setPatternFilter}
          />
        </DashboardSection>

        <DashboardSection
          title="High-Risk Areas"
          description="Click an area to focus the table on matching locations."
        >
          <InsightGroupList
            items={highRiskAreaItems}
            activeFilter={patternFilter}
            filterType="highRiskArea"
            onSelect={setPatternFilter}
          />
        </DashboardSection>
      </DashboardTwoColumn>

      {selectedGroup ? (
        <DashboardSection
          title={`Reports for ${selectedGroup.label}`}
          description="Reports connected to the selected insight."
          action={
            <button
              type="button"
              onClick={() => setPatternFilter(null)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Clear filter
            </button>
          }
        >
          <ReportReferenceList item={selectedGroup} />
        </DashboardSection>
      ) : null}

      <DashboardSection
        title="Repeated Problem Patterns"
        description="Search, sort, and filter repeat failures using real occurrence and affected-inspection counts."
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Search issues"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-56 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:border-indigo-300 dark:focus:ring-indigo-300/10"
            />
            <DashboardSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions.map((option) => ({ label: `Sort: ${option.label}`, value: option.value }))}
            />
          </div>
        }
      >
        {patternFilter ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Filtered by {patternFilter.label}</span>
            <button
              type="button"
              onClick={() => setPatternFilter(null)}
              className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
            >
              Clear
            </button>
          </div>
        ) : null}
        <DashboardDataTable
          stickyHeader
          maxHeightClassName="max-h-[34rem]"
          emptyMessage="No repeated problem patterns match this search or filter."
          getRowKey={(row) => row.issue}
          rowClassName={() => "select-none"}
          columns={[
            {
              key: "issue",
              header: "Issue",
              render: (row: PatternRow) => (
                <span className="font-medium text-slate-900 dark:text-white">
                  {row.issue}
                </span>
              ),
            },
            {
              key: "occurrence",
              header: "Occurrence",
              render: (row: PatternRow) => (
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {row.occurrenceCount ?? row.failCount ?? row.occurrence} findings
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatPercent(row.failureShareValue, row.failureShare ?? row.occurrence)} of selected findings
                  </div>
                </div>
              ),
            },
            {
              key: "category",
              header: "Category / Area",
              render: (row: PatternRow) => (
                <span>
                  {(row.categories ?? [row.category ?? "General"]).join(", ")}
                  {row.locations?.length ? ` / ${row.locations.join(", ")}` : ""}
                </span>
              ),
            },
            {
              key: "inspectionsAffected",
              header: "Affected inspections",
              render: (row: PatternRow) => row.affectedInspectionCount ?? row.inspectionsAffected ?? "Unknown",
            },
            {
              key: "highestSeverity",
              header: "Severity",
              render: (row: PatternRow) => (
                <SeverityBadge severity={row.highestSeverity} legend={insights.severityLegend} />
              ),
            },
            {
              key: "aiRecommendation",
              header: "Action",
              render: (row: PatternRow) =>
                row.aiRecommendation ??
                aiPatternActions.get(row.issue) ??
                "Assign an owner and collect close-out evidence before reinspection.",
            },
          ]}
          rows={filteredPatterns}
        />
      </DashboardSection>

      <DashboardSection
        title="Severity Guide"
        description="Use this legend to decide how urgently each row should be handled."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {(insights.severityLegend ?? []).map((item) => (
            <div
              key={item.level}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/55"
              title={item.recommendedAction}
            >
              <DashboardBadge label={item.level} tone={severityTone(item.level)} />
              <p className="mt-2 text-sm/6 text-slate-700 dark:text-slate-200">{item.meaning}</p>
              <p className="mt-2 text-xs/5 font-medium text-slate-500 dark:text-slate-400">{item.recommendedAction}</p>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Current Project Actions"
        description="Open findings from the active project/report that need clear next steps."
      >
        <DashboardDataTable
          emptyMessage="No current project actions for this inspection type."
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
            { key: "location", header: "Location", render: (row) => row.location },
            { key: "trade", header: "Trade / Category", render: (row) => `${row.trade} / ${row.category}` },
            { key: "evidenceRequired", header: "Evidence", render: (row) => row.evidenceRequired.join(", ") },
            {
              key: "severity",
              header: "Severity",
              render: (row) => <SeverityBadge severity={row.severity} legend={insights.severityLegend} />,
            },
            { key: "nextAction", header: "Next action", render: (row) => row.nextAction },
          ]}
          rows={aiData?.currentProjectActions ?? []}
        />
      </DashboardSection>

      <DashboardSection
        title="Pre-Inspection Checklist"
        description="Items to close out before booking or attending the next inspection."
      >
        <DashboardDataTable
          emptyMessage="No checklist items are available for this inspection type."
          columns={[
            {
              key: "item",
              header: "Check",
              render: (row) => (
                <span className="font-medium text-slate-900 dark:text-white">
                  {row.item}
                </span>
              ),
            },
            { key: "reason", header: "Reason", render: (row) => row.reason },
            { key: "category", header: "Category", render: (row) => row.category ?? "General" },
            { key: "trade", header: "Trade", render: (row) => row.trade ?? "General" },
            { key: "evidenceRequired", header: "Evidence", render: (row) => row.evidenceRequired.join(", ") },
            {
              key: "priority",
              header: "Priority",
              render: (row) => <SeverityBadge severity={row.priority} legend={insights.severityLegend} />,
            },
          ]}
          rows={aiData?.preInspectionChecklist ?? []}
        />
      </DashboardSection>

      <DashboardTwoColumn>
        <DashboardSection
          title="Lessons From Past Projects"
          description="Completed, closed, or archived project failures turned into prevention advice for new work."
        >
          <PastLessonsPanel insights={insights} aiData={aiData} />
        </DashboardSection>

        <DashboardSection
          title="Project Comparison"
          description="Compare current projects with past projects by recurring issue themes."
        >
          <ProjectComparisonPanel insights={insights} />
        </DashboardSection>
      </DashboardTwoColumn>

      <DashboardSection
        title="Export"
        description="Download or share the extracted insight report currently shown on this page."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadInsightsReport(insights, aiData)}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Download report
            </button>
            <button
              type="button"
              onClick={() => shareInsightsReport(insights, aiData, setShareStatus)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Share
            </button>
          </div>
        }
      >
        {shareStatus ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{shareStatus}</p>
        ) : (
          <p className="text-sm/6 text-slate-600 dark:text-slate-300">
            The export contains only the report-derived summaries, counts, issue groups, and current action lists shown above.
          </p>
        )}
      </DashboardSection>
    </div>
  );
}

function InsightGroupList(props: {
  items: InsightGroupItem[];
  activeFilter: PatternFilter;
  filterType: "rootCause" | "highRiskArea";
  onSelect: (filter: PatternFilter) => void;
}) {
  if (!props.items.length) {
    return <EmptySectionMessage message="No insight groupings are available for this inspection type." />;
  }

  return (
    <div className="space-y-3">
      {props.items.map((item) => {
        const isActive = props.activeFilter?.type === props.filterType && props.activeFilter.value === item.label;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() =>
              props.onSelect(isActive ? null : { type: props.filterType, value: item.label, label: item.label })
            }
            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
              isActive
                ? "border-indigo-300 bg-indigo-50 dark:border-indigo-300/40 dark:bg-indigo-400/10"
                : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-indigo-300/30 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</h3>
                <p className="mt-1 text-xs/5 text-slate-500 dark:text-slate-400">
                  {item.affectedInspectionCount ?? item.reportIds?.length ?? 0} affected inspections
                  {item.projectCount ? ` across ${item.projectCount} project${item.projectCount === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <span className="rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-slate-900 shadow-sm dark:bg-white/10 dark:text-white">
                {item.count}
              </span>
            </div>
            {item.highestSeverity ? (
              <div className="mt-3">
                <DashboardBadge label={item.highestSeverity} tone={severityTone(item.highestSeverity)} />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ReportReferenceList({ item }: { item: InsightGroupItem }) {
  const reports = item.reports ?? [];
  if (!reports.length) {
    return <EmptySectionMessage message="No linked report references were returned for this insight." />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => (
        <Link
          key={report.id}
          href={`/app/reports/${report.id}`}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-indigo-200 hover:bg-white dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-indigo-300/30 dark:hover:bg-white/5"
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {report.project ?? report.site ?? "Inspection report"}
          </div>
          <div className="mt-1 text-xs/5 text-slate-500 dark:text-slate-400">
            {[report.inspectionType, report.reportDate].filter(Boolean).join(" - ") || report.id}
          </div>
        </Link>
      ))}
    </div>
  );
}

function PastLessonsPanel(props: {
  insights: DashboardInsightsResponse;
  aiData: AiInspectionInsightsResponse | null;
}) {
  const aiLessons = props.aiData?.historicalLessons ?? props.aiData?.oldProjectLessons ?? [];
  if (aiLessons.length) {
    return (
      <div className="grid gap-4">
        {aiLessons.map((item) => (
          <DashboardSubCard key={`${item.lesson}-${item.pattern}`} title={item.lesson} description={item.pattern}>
            <div className="space-y-3 text-sm/6 text-slate-700 dark:text-slate-200">
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Seen in: </span>
                {item.seenInProjects.join(", ") || "Past projects"}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Action for new projects: </span>
                {item.recommendationForNewProjects}
              </p>
            </div>
          </DashboardSubCard>
        ))}
      </div>
    );
  }

  const lessons = props.insights.lessonsFromPastProjects ?? [];
  if (!lessons.length) {
    return <EmptySectionMessage message="No completed project lessons available yet. This section will appear once previous projects are closed or archived." />;
  }

  return (
    <div className="grid gap-4">
      {lessons.map((item) => (
        <DashboardSubCard key={item.title} title={item.title} description={`${item.issueCount} issues across ${item.projectCount} project(s)`}>
          <div className="space-y-3 text-sm/6 text-slate-700 dark:text-slate-200">
            <p>
              <span className="font-semibold text-slate-900 dark:text-white">Recurring issues: </span>
              {item.recurringIssues.join(", ")}
            </p>
            <p>{item.recommendation}</p>
          </div>
        </DashboardSubCard>
      ))}
    </div>
  );
}

function ProjectComparisonPanel({ insights }: { insights: DashboardInsightsResponse }) {
  const rows = insights.projectComparisons ?? [];
  if (!rows.length) {
    return <EmptySectionMessage message="No project comparison data is available for this inspection type." />;
  }

  return (
    <div className="space-y-3">
      {rows.slice(0, 6).map((project) => (
        <div
          key={project.project}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/55"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{project.project}</h3>
              <p className="mt-1 text-xs/5 text-slate-500 dark:text-slate-400">
                {project.lifecycle} - {project.openIssueCount} open of {project.issueCount} issues
              </p>
            </div>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
              {project.dominantRootCause}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.topIssues.map((issue) => (
              <span
                key={`${project.project}-${issue.issue}`}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300"
              >
                {issue.issue}: {issue.count}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeverityBadge(props: {
  severity?: "Low" | "Medium" | "High" | "Critical";
  legend?: DashboardInsightsResponse["severityLegend"];
}) {
  const severity = props.severity ?? "Low";
  const legendItem = props.legend?.find((item) => item.level === severity);
  return (
    <span title={legendItem ? `${legendItem.meaning} ${legendItem.recommendedAction}` : undefined}>
      <DashboardBadge label={severity} tone={severityTone(severity)} />
    </span>
  );
}

function LoadingPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100">
      <span className="size-3 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700 dark:border-indigo-200/30 dark:border-t-indigo-100" />
      {label}
    </span>
  );
}

function EmptySectionMessage(props: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm/6 text-slate-600 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-300">
      {props.message}
    </div>
  );
}

function InsightsLoadingState() {
  return (
    <div className="space-y-6">
      <DashboardPageIntro
        eyebrow="Insights"
        title="Loading insights"
        description="Refreshing inspection patterns and AI learning notes."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
        <div className="h-56 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
    </div>
  );
}

function NoInsightsDataState() {
  return (
    <div className="space-y-8">
      <DashboardPageIntro
        eyebrow="Insights"
        title="No extraction insights available"
        description="No inspection reports have been uploaded yet. Upload past inspection reports to generate AI-powered lessons, pre-inspection checklists, and risk patterns."
      />

      <DashboardSection
        title="Insights waiting for reports"
        description="Deleted files are no longer used, so stale insight data is hidden."
      >
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-white/10 dark:bg-slate-950/55">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No uploaded inspection reports were found.
          </p>
          <p className="mt-2 text-sm/6 text-slate-600 dark:text-slate-300">
            Upload past inspection reports to generate AI-powered lessons, pre-inspection checklists, and risk patterns.
          </p>
        </div>
      </DashboardSection>
    </div>
  );
}

function normaliseGroupItems(
  items: InsightGroupItem[] | undefined,
  labels: string[] | undefined,
  type: "rootCause" | "highRiskArea"
) {
  if (items?.length) return items;
  return (labels ?? []).map((label) => ({
    label,
    count: 0,
    tableFilter: { type, value: label },
  }));
}

function patternMatchesFilter(row: PatternRow, filter: PatternFilter) {
  if (!filter) return true;
  const haystack =
    filter.type === "rootCause"
      ? [row.category, ...(row.categories ?? [])]
      : [...(row.locations ?? [])];
  return haystack.some((value) => String(value).toLowerCase() === filter.value.toLowerCase());
}

function comparePatternRows(
  a: PatternRow,
  b: PatternRow,
  field: string,
  direction: "asc" | "desc"
) {
  const aValue = patternSortValue(a, field);
  const bValue = patternSortValue(b, field);
  const multiplier = direction === "asc" ? 1 : -1;
  if (typeof aValue === "number" && typeof bValue === "number") {
    return (aValue - bValue) * multiplier;
  }
  return String(aValue).localeCompare(String(bValue)) * multiplier;
}

function patternSortValue(row: PatternRow, field: string) {
  if (field === "occurrenceCount") return row.occurrenceCount ?? row.failCount ?? 0;
  if (field === "severityRank") return row.severityRank ?? severityRank(row.highestSeverity);
  if (field === "affectedInspectionCount") return row.affectedInspectionCount ?? Number(row.inspectionsAffected ?? 0);
  return row.issue;
}

function severityRank(severity?: "Low" | "Medium" | "High" | "Critical") {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[severity ?? "Low"];
}

function formatPercent(value?: number, fallback?: string) {
  if (typeof value === "number") return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  return fallback ?? "0%";
}

function buildInsightsExportPayload(
  insights: DashboardInsightsResponse,
  aiData: AiInspectionInsightsResponse | null
) {
  return {
    generatedAt: new Date().toISOString(),
    title: insights.export?.title ?? "Inspection insights report",
    filter: insights.filter,
    rootCauseItems: insights.rootCauseItems ?? [],
    highRiskAreaItems: insights.highRiskAreaItems ?? [],
    repeatedPatterns: insights.repeatedPatterns,
    severityLegend: insights.severityLegend ?? [],
    projectComparisons: insights.projectComparisons ?? [],
    lessonsFromPastProjects: insights.lessonsFromPastProjects ?? [],
    ai: aiData
      ? {
          aiAvailable: aiData.aiAvailable,
          fallbackMessage: aiData.fallbackMessage,
          executiveSummary: aiData.executiveSummary,
          preInspectionChecklist: aiData.preInspectionChecklist,
          historicalLessons: aiData.historicalLessons ?? aiData.oldProjectLessons,
        }
      : null,
  };
}

function downloadInsightsReport(
  insights: DashboardInsightsResponse,
  aiData: AiInspectionInsightsResponse | null
) {
  const payload = buildInsightsExportPayload(insights, aiData);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = insights.export?.fileName ?? "inspection-insights-report.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function shareInsightsReport(
  insights: DashboardInsightsResponse,
  aiData: AiInspectionInsightsResponse | null,
  setShareStatus: (value: string | null) => void
) {
  const payload = buildInsightsExportPayload(insights, aiData);
  const summary = JSON.stringify(payload, null, 2);
  const text = insights.export?.shareText ?? "Inspection insights summary for team training.";

  try {
    if (navigator.share) {
      await navigator.share({ title: payload.title, text });
      setShareStatus("Share sheet opened.");
      return;
    }
    await navigator.clipboard.writeText(summary);
    setShareStatus("Insights copied to clipboard.");
  } catch {
    setShareStatus("Sharing is unavailable in this browser.");
  }
}

function severityTone(severity?: "Low" | "Medium" | "High" | "Critical") {
  if (severity === "Critical" || severity === "High") return "critical";
  if (severity === "Medium") return "warning";
  if (severity === "Low") return "success";
  return "neutral";
}
