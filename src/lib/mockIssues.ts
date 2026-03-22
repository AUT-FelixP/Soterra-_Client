export type IssueRecord = {
  id: string;
  description: string;
  site: string;
  dateIdentified: string;
  status: "Open" | "Closed";
  reinspections: number;
  closedAt?: string;
};

const issues: IssueRecord[] = [
  {
    id: "issue-2026-1",
    description: "Pipe supports not properly anchored",
    site: "Bayfront Site A",
    dateIdentified: "2026-02-03",
    status: "Open",
    reinspections: 1,
  },
  {
    id: "issue-2026-2",
    description: "Pressure test failed at 2nd floor manifold",
    site: "Campus Block 2",
    dateIdentified: "2026-02-01",
    status: "Closed",
    reinspections: 2,
    closedAt: "2026-02-10",
  },
];

export function getIssues() {
  return [...issues];
}

export function getIssueById(id: string) {
  return issues.find((issue) => issue.id === id) ?? null;
}

export function addIssue(payload: {
  id?: string;
  description: string;
  site: string;
  dateIdentified?: string;
  status?: "Open" | "Closed";
  reinspections?: number;
  closedAt?: string;
}) {
  const issue: IssueRecord = {
    id: payload.id ?? `issue-${Date.now()}`,
    description: payload.description,
    site: payload.site,
    dateIdentified: payload.dateIdentified ?? new Date().toISOString().slice(0, 10),
    status: payload.status ?? "Open",
    reinspections: payload.reinspections ?? 0,
    closedAt: payload.closedAt,
  };

  issues.unshift(issue);
  return issue;
}

export function updateIssue(
  id: string,
  updates: { status?: "Open" | "Closed" }
) {
  const index = issues.findIndex((issue) => issue.id === id);

  if (index === -1) {
    return null;
  }

  const existing = issues[index];
  const nextStatus = updates.status ?? existing.status;
  const updated: IssueRecord = {
    ...existing,
    ...updates,
    status: nextStatus,
    closedAt:
      nextStatus === "Closed"
        ? existing.closedAt ?? new Date().toISOString().slice(0, 10)
        : undefined,
  };

  issues[index] = updated;
  return updated;
}
