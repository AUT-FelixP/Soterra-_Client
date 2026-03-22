import { NextResponse } from "next/server";
import { getReports } from "@/lib/mockReports";

type Severity = "Low" | "Medium" | "High" | "Critical";

const severityRank: Record<Severity, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

export async function GET() {
  const reports = getReports();
  const issueMap = new Map<
    string,
    {
      title: string;
      occurrences: number;
      highestSeverity: Severity;
    }
  >();

  let totalIssues = 0;

  for (const report of reports) {
    for (const issue of report.issues) {
      totalIssues += 1;

      const existing = issueMap.get(issue.title);
      if (!existing) {
        issueMap.set(issue.title, {
          title: issue.title,
          occurrences: 1,
          highestSeverity: issue.severity,
        });
        continue;
      }

      existing.occurrences += 1;
      if (severityRank[issue.severity] > severityRank[existing.highestSeverity]) {
        existing.highestSeverity = issue.severity;
      }
    }
  }

  const topIssues = [...issueMap.values()]
    .sort((a, b) => {
      if (b.occurrences !== a.occurrences) {
        return b.occurrences - a.occurrences;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, 5);

  return NextResponse.json({ topIssues, totalIssues });
}
