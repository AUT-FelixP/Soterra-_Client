import { NextRequest, NextResponse } from "next/server";
import { getReports } from "@/lib/mockReports";
import { getSiteById } from "@/lib/mockSites";

type Severity = "Low" | "Medium" | "High" | "Critical";
type TrendMetricKey = "issueCount" | "highRiskCount" | "completionRate";
type TrendPoint = {
  label: string;
  date: string;
  value: number;
};

const severityRank: Record<Severity, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseIsoDate(value));
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dateRange(startIso: string, endIso: string) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();

  const site = siteId ? getSiteById(siteId) : null;
  const selectedSiteName = site?.siteName ?? null;

  let reports = getReports();
  if (selectedSiteName) {
    reports = reports.filter((report) => report.site === selectedSiteName);
  }
  if (from) {
    reports = reports.filter((report) => report.createdAt >= from);
  }
  if (to) {
    reports = reports.filter((report) => report.createdAt <= to);
  }

  const issueMap = new Map<
    string,
    {
      title: string;
      occurrences: number;
      highestSeverity: Severity;
      lastSeen: string;
      sites: Set<string>;
    }
  >();

  let issuesTotal = 0;
  let highRiskIssues = 0;
  let completedReports = 0;

  for (const report of reports) {
    if (report.status === "Completed") {
      completedReports += 1;
    }

    for (const issue of report.issues) {
      issuesTotal += 1;
      if (issue.severity === "High" || issue.severity === "Critical") {
        highRiskIssues += 1;
      }

      const existing = issueMap.get(issue.title);
      if (!existing) {
        issueMap.set(issue.title, {
          title: issue.title,
          occurrences: 1,
          highestSeverity: issue.severity,
          lastSeen: report.createdAt,
          sites: new Set([report.site]),
        });
        continue;
      }

      existing.occurrences += 1;
      existing.lastSeen =
        report.createdAt > existing.lastSeen ? report.createdAt : existing.lastSeen;
      existing.sites.add(report.site);
      if (severityRank[issue.severity] > severityRank[existing.highestSeverity]) {
        existing.highestSeverity = issue.severity;
      }
    }
  }

  const topIssues = [...issueMap.values()]
    .sort((a, b) => {
      if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
      return b.lastSeen.localeCompare(a.lastSeen);
    })
    .slice(0, 8)
    .map((issue) => ({
      title: issue.title,
      occurrences: issue.occurrences,
      highestSeverity: issue.highestSeverity,
      lastSeen: issue.lastSeen,
      affectedSites: issue.sites.size,
    }));

  const completionRate =
    reports.length === 0
      ? "0%"
      : `${((completedReports / reports.length) * 100).toFixed(1)}%`;

  const sortedReports = [...reports].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  const defaultTo = sortedReports.at(-1)?.createdAt ?? toIsoDate(new Date());
  const defaultFrom = sortedReports[0]?.createdAt ?? defaultTo;
  const trendFrom = from && from <= defaultTo ? from : defaultFrom;
  const trendTo = to && to >= trendFrom ? to : defaultTo;

  const buckets = dateRange(trendFrom, trendTo);
  const trendSeries: Record<TrendMetricKey, TrendPoint[]> = {
    issueCount: [],
    highRiskCount: [],
    completionRate: [],
  };

  for (const bucketDate of buckets) {
    const bucketReports = reports.filter((report) => report.createdAt === bucketDate);
    const bucketIssueCount = bucketReports.reduce(
      (sum, report) => sum + report.issues.length,
      0
    );
    const bucketHighRiskCount = bucketReports.reduce(
      (sum, report) =>
        sum +
        report.issues.filter(
          (issue) => issue.severity === "High" || issue.severity === "Critical"
        ).length,
      0
    );
    const bucketCompletionRate =
      bucketReports.length === 0
        ? 0
        : Number(
            ((bucketReports.filter((report) => report.status === "Completed").length /
              bucketReports.length) *
              100).toFixed(1)
          );

    trendSeries.issueCount.push({
      label: formatLabel(bucketDate),
      date: bucketDate,
      value: bucketIssueCount,
    });
    trendSeries.highRiskCount.push({
      label: formatLabel(bucketDate),
      date: bucketDate,
      value: bucketHighRiskCount,
    });
    trendSeries.completionRate.push({
      label: formatLabel(bucketDate),
      date: bucketDate,
      value: bucketCompletionRate,
    });
  }

  return NextResponse.json({
    summary: [
      { name: "Reports in range", value: String(reports.length) },
      { name: "Issues captured", value: String(issuesTotal) },
      { name: "High-risk issues", value: String(highRiskIssues) },
      { name: "Completion rate", value: completionRate },
    ],
    topIssues,
    trend: {
      siteId: siteId ?? "",
      siteName: selectedSiteName,
      from: trendFrom,
      to: trendTo,
      series: {
        issueCount: {
          name: "Issue count",
          unit: "issues",
          points: trendSeries.issueCount,
        },
        highRiskCount: {
          name: "High-risk count",
          unit: "issues",
          points: trendSeries.highRiskCount,
        },
        completionRate: {
          name: "Completion rate",
          unit: "%",
          points: trendSeries.completionRate,
        },
      },
    },
  });
}
