export type DashboardOverviewResponse = {
  title: string;
  description: string;
  metrics: Array<{
    label: string;
    value: string;
    tone?: "default" | "critical" | "warning" | "success";
  }>;
  liveTracker: {
    openIssues: number;
    overdue: number;
    readyForInspection: number;
    href: string;
  };
  performanceTrend: Array<{ label: string; value: number; formattedValue: string }>;
  upcomingRisks: Array<{
    title: string;
    subtitle: string;
    daysAway: number;
    level: "High" | "Medium" | "Low";
  }>;
  topFailureDrivers: Array<{
    issue: string;
    failCount: number;
    failureShare: string;
    inspections: number;
  }>;
  issueStatusSummary: Array<{ label: string; value: string }>;
};

export type DashboardCompanyResponse = {
  title: string;
  description: string;
  projects: Array<{
    slug: string;
    name: string;
    inspections: number;
    extractedIssues: string;
    openIssues: string;
    issuesPerInspection: string;
  }>;
  inspectionTypes: Array<{
    type: string;
    inspections: number;
    extractedIssues: string;
    openIssues: string;
    issuesPerInspection: string;
    tone?: "default" | "critical" | "warning" | "success";
  }>;
};

export type DashboardPerformanceResponse = {
  title: string;
  description: string;
  filter: {
    selected: string;
    options: string[];
  };
  topFailureDrivers: Array<{
    rank: number;
    issue: string;
    failCount: number;
    failureShare: string;
    inspectionsAffected: string;
  }>;
  recurringRisks: Array<{
    issue: string;
    recurrenceLikelihood: string;
    repeatCount?: string;
    inspectionsAffected?: string;
    tone?: "critical" | "warning" | "success";
  }>;
  recurrenceSummary: string;
};

export type DashboardInsightsResponse = {
  title: string;
  description: string;
  filter: {
    selected: string;
    options: string[];
  };
  rootCauses: string[];
  highRiskAreas: string[];
  repeatedPatterns: Array<{
    issue: string;
    occurrence: string;
    inspectionsAffected?: string;
    highestSeverity?: "Low" | "Medium" | "High" | "Critical";
  }>;
};

export type DashboardRiskResponse = {
  title: string;
  description: string;
  filters: {
    sites: string[];
    selectedSite: string;
    windows: Array<{ label: string; value: string }>;
    selectedWindow: string;
  };
  inspections: Array<{
    id: string;
    type: string;
    site: string;
    expectedDate: string;
    daysAway: number;
    riskLevel: "High" | "Medium" | "Low";
  }>;
  selectedInspectionId: string;
  likelyFailureTitle: string;
  likelyFailureSubtitle: string;
  likelyFailures: Array<{
    issue: string;
    historicalFailCount: number;
    failureShare: string;
    recurrenceLikelihood: string;
    tone?: "critical" | "warning" | "success";
  }>;
};

export type DashboardProjectResponse = {
  title: string;
  description: string;
  metrics: Array<{
    label: string;
    value: string;
    tone?: "default" | "critical" | "warning" | "success";
  }>;
  trackerSnapshot: {
    open: number;
    ready: number;
    closedLast7Days: number;
    href: string;
  };
  openItemsByType: Array<{ label: string; value: string }>;
  topFailureDrivers: Array<{
    issue: string;
    count: number;
    failShare: string;
  }>;
  versusCompanyAverage: Array<{
    label: string;
    projectValue: string;
    companyValue: string;
    deltaLabel: string;
    tone?: "critical" | "warning" | "success";
  }>;
  recentFailedItems: Array<{
    id: string;
    issue: string;
    type: string;
    date: string;
    status: "Open" | "Ready" | "Closed";
  }>;
};
