export type SoterraMetricRoute = {
  id: string;
  name: string;
  description: string;
  frontendPath: string;
  backendPath: string;
  keywords: string[];
};

export const soterraMetricRoutes = [
  {
    id: "dashboard-overview",
    name: "Dashboard overview",
    description: "Top-level metrics, live tracker snapshot, upcoming risk, and common failures.",
    frontendPath: "/api/dashboard",
    backendPath: "/dashboard",
    keywords: ["dashboard", "overview", "metric", "kpi", "summary", "statistics", "stats"],
  },
  {
    id: "company-performance",
    name: "Company performance",
    description: "Project and inspection-type performance across the client account.",
    frontendPath: "/api/dashboard/company",
    backendPath: "/dashboard/company",
    keywords: ["company", "project", "projects", "inspection type", "portfolio", "client"],
  },
  {
    id: "performance",
    name: "Performance metrics",
    description: "Most common issues, recurrence risk, and failure-driver statistics.",
    frontendPath: "/api/dashboard/performance",
    backendPath: "/dashboard/performance",
    keywords: ["performance", "common", "failure", "driver", "recurring", "repeat", "issue"],
  },
  {
    id: "risk",
    name: "Inspection risk",
    description: "Upcoming inspections, likely failures, and recurrence likelihood.",
    frontendPath: "/api/dashboard/risk",
    backendPath: "/dashboard/risk",
    keywords: ["risk", "upcoming", "likely", "inspection", "window", "days away"],
  },
  {
    id: "legacy-insights",
    name: "Legacy insights",
    description: "The previous insights data source for root causes and repeated patterns.",
    frontendPath: "/api/dashboard/insights",
    backendPath: "/dashboard/insights",
    keywords: ["insight", "insights", "root cause", "pattern", "high risk"],
  },
  {
    id: "tracker",
    name: "Live tracker",
    description: "Open, ready, and closed issue counts plus issue register data.",
    frontendPath: "/api/tracker",
    backendPath: "/tracker",
    keywords: ["tracker", "open", "ready", "closed", "status", "issue register"],
  },
  {
    id: "reports",
    name: "Reports",
    description: "Uploaded inspection reports, statuses, sites, and extracted issues.",
    frontendPath: "/api/reports",
    backendPath: "/reports",
    keywords: ["report", "reports", "uploaded", "site", "document", "pdf"],
  },
] satisfies SoterraMetricRoute[];

export function selectSoterraMetricRoutes(question: string) {
  const normalizedQuestion = question.toLowerCase();
  const matches = soterraMetricRoutes.filter((route) =>
    route.keywords.some((keyword) => normalizedQuestion.includes(keyword))
  );

  if (matches.length) {
    return matches;
  }

  return soterraMetricRoutes.filter((route) =>
    ["dashboard-overview", "performance", "risk", "tracker", "reports"].includes(route.id)
  );
}
