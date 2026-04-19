import { getReports } from "@/lib/mockReports";
import { getIssues, type IssueRecord } from "@/lib/mockIssues";

export function getTrackerIssues(): IssueRecord[] {
  const storedIssues = getIssues();
  const derivedIssues: IssueRecord[] = getReports()
    .flatMap((report) =>
      report.issues
        .filter((issue) => issue.title === "AI extraction pending review")
        .map((issue) => ({
          id: issue.id,
          description: issue.title,
          site: report.site,
          dateIdentified: report.createdAt,
          status: "Open" as const,
          reinspections: 0,
        }))
    )
    .filter(
      (issue) => !storedIssues.some((storedIssue) => storedIssue.id === issue.id)
    );

  return [...derivedIssues, ...storedIssues];
}
