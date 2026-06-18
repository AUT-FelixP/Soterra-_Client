import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";

export type InsightFilters = {
  project: string;
  site: string;
  inspection_type: string;
  trade: string;
  severity: string;
  status: string;
  date_range: string;
};

export type ChartDatum = DashboardInsightsResponse["visuals"]["severityDonut"][number];

export const DEFAULT_INSIGHT_FILTERS: InsightFilters = {
  project: "All projects",
  site: "All sites",
  inspection_type: "All inspection types",
  trade: "All trades",
  severity: "All severities",
  status: "All statuses",
  date_range: "All time",
};

export const DATE_LABELS: Record<string, string> = {
  "All time": "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

