import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import { DEFAULT_INSIGHT_FILTERS, type InsightFilters } from "./insights-types";

type Issue = DashboardInsightsResponse["issueDrilldown"][number];

const SEVERITY_RANK: Record<Issue["severity"], number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

function countBy(rows: Issue[], getName: (issue: Issue) => string, limit?: number) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const name = getName(row);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

function buildIssuePriorities(rows: Issue[]): DashboardInsightsResponse["riskMatrix"] {
  const groups = Map.groupBy(rows, (row) => row.issue || "Untitled finding");
  return [...groups.entries()].map(([issue, matches]) => {
    const highestSeverity = matches.reduce<Issue["severity"]>(
      (highest, row) => SEVERITY_RANK[row.severity] > SEVERITY_RANK[highest] ? row.severity : highest,
      "Low"
    );
    const openCount = matches.filter((row) => row.status === "Open").length;
    const riskScore = Math.min(100, SEVERITY_RANK[highestSeverity] * 20 + Math.min(matches.length - 1, 5) * 6 + Math.min(openCount, 5) * 4);
    const riskLevel: DashboardInsightsResponse["riskMatrix"][number]["riskLevel"] =
      riskScore >= 80 ? "Critical" : riskScore >= 60 ? "High" : riskScore >= 35 ? "Medium" : "Low";
    return {
      issue,
      highestSeverity,
      repeatCount: matches.length,
      openCount,
      projectCount: new Set(matches.map((row) => row.project).filter(Boolean)).size,
      riskScore,
      riskLevel,
    };
  }).sort((a, b) => b.riskScore - a.riskScore || b.repeatCount - a.repeatCount || a.issue.localeCompare(b.issue));
}

function buildDataQuality(rows: Issue[]): DashboardInsightsResponse["dataQuality"] {
  const total = rows.length;
  const metric = (count: number) => ({ count, percent: total ? Math.round((count / total) * 1000) / 10 : 0 });
  const metrics = {
    missingLocation: metric(rows.filter((row) => !row.location).length),
    missingTrade: metric(rows.filter((row) => !row.trade || row.trade === "General").length),
    lowConfidence: metric(rows.filter((row) => (row.confidence ?? 0) < 0.6).length),
    missingEvidence: metric(rows.filter((row) => row.evidenceRequired.length === 0).length),
  };
  return {
    totalRows: total,
    health: total === 0 || Object.values(metrics).every(({ percent }) => percent < 20) ? "Good" : "Needs review",
    ...metrics,
  };
}

export function filterInsightsByIssueLocation(data: DashboardInsightsResponse, filters: InsightFilters) {
  const reportIsActive = filters.report_id !== DEFAULT_INSIGHT_FILTERS.report_id;
  const locationIsActive = filters.location !== DEFAULT_INSIGHT_FILTERS.location;
  if (!reportIsActive && !locationIsActive) return data;

  const rows = data.issueDrilldown.filter((row) =>
    (!reportIsActive || row.reportId === filters.report_id) &&
    (!locationIsActive || row.location === filters.location)
  );
  const issueCounts = new Map(countBy(rows, (row) => row.issue).map(({ name, value }) => [name, value]));
  const repeatCount = [...issueCounts.values()].reduce((sum, count) => sum + (count > 1 ? count : 0), 0);
  const openCount = rows.filter((row) => row.status === "Open").length;

  return {
    ...data,
    kpis: data.kpis.map((kpi) => ({
      ...kpi,
      value: kpi.key === "inspections" ? new Set(rows.map((row) => row.reportId)).size
        : kpi.key === "issues" ? rows.length
        : kpi.key === "open" ? openCount
        : kpi.key === "highRisk" ? rows.filter((row) => row.severity === "Critical" || row.severity === "High").length
        : kpi.key === "repeatRate" ? (rows.length ? Math.round((repeatCount / rows.length) * 1000) / 10 : 0)
        : kpi.value,
    })),
    visuals: {
      severityDonut: countBy(rows, (row) => row.severity),
      statusDonut: countBy(rows, (row) => row.status || "Unknown"),
      tradeBar: countBy(rows, (row) => row.trade || "Unassigned", 8),
      categoryBar: countBy(rows, (row) => row.category || "General", 8),
      locationBar: countBy(rows, (row) => row.location || "Exact location not stated", 8),
      issuesOverTime: countBy(rows, (row) => row.createdAt.slice(0, 10)).sort((a, b) => a.name.localeCompare(b.name)),
      projectComparison: countBy(rows, (row) => row.project || "Unknown project", 10),
    },
    riskMatrix: buildIssuePriorities(rows),
    issueDrilldown: rows,
    dataQuality: buildDataQuality(rows),
  } satisfies DashboardInsightsResponse;
}
