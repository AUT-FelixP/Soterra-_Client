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
    hasReports?: boolean;
    filters: {
      projects: string[];
      sites: string[];
      inspectionTypes: string[];
      trades: string[];
      severities: string[];
      statuses: string[];
      dateRanges: string[];
    };
    selectedFilters: {
      project: string;
      site: string;
      inspectionType: string;
      trade: string;
      severity: string;
      status: string;
      dateRange: string;
    };
    kpis: Array<{ key: string; label: string; value: number; suffix?: string }>;
    visuals: Record<
      "severityDonut" | "statusDonut" | "tradeBar" | "categoryBar" | "locationBar" | "issuesOverTime" | "projectComparison",
      Array<{ name: string; value: number }>
    >;
    riskMatrix: Array<{
      issue: string;
      highestSeverity: "Low" | "Medium" | "High" | "Critical";
      repeatCount: number;
      openCount: number;
      projectCount: number;
      riskScore: number;
      riskLevel: "Low" | "Medium" | "High" | "Critical";
    }>;
    issueDrilldown: Array<{
      id: string; issue: string; summary?: string; project?: string; site?: string;
      location?: string; inspectionType?: string; trade?: string; category?: string;
      severity: "Low" | "Medium" | "High" | "Critical"; status: string;
      requiredFix?: string; evidenceRequired: string[]; confidence?: number;
      createdAt: string; reportId: string;
    }>;
    dataQuality: {
      totalRows: number;
      health: "Good" | "Needs review";
      missingLocation: { count: number; percent: number };
      missingTrade: { count: number; percent: number };
      lowConfidence: { count: number; percent: number };
      missingEvidence: { count: number; percent: number };
    };
  rootCauses: string[];
  rootCauseItems?: InsightGroupItem[];
  highRiskAreas: string[];
  highRiskAreaItems?: InsightGroupItem[];
  repeatedPatterns: Array<{
    issue: string;
    occurrence: string;
    failureShare?: string;
    failureShareValue?: number;
    failCount?: number;
    occurrenceCount?: number;
    inspectionsAffected?: string;
    affectedInspectionCount?: number;
    projectCount?: number;
    highestSeverity?: "Low" | "Medium" | "High" | "Critical";
    severityRank?: number;
    issueIds?: string[];
    reportIds?: string[];
    reports?: InsightReportRef[];
    categories?: string[];
    locations?: string[];
    category?: string;
    relatedTrades?: string[];
    aiRecommendation?: string;
  }>;
  severityLegend?: Array<{
    level: "Medium" | "High" | "Critical";
    meaning: string;
    recommendedAction: string;
  }>;
  tableControls?: {
    searchFields: string[];
    sortOptions: Array<{
      value: string;
      label: string;
      field: string;
      direction: "asc" | "desc";
    }>;
  };
  projectComparisons?: Array<{
    project: string;
    lifecycle: string;
    issueCount: number;
    openIssueCount: number;
    topIssues: Array<{ issue: string; count: number }>;
    dominantRootCause: string;
  }>;
  lessonsFromPastProjects?: Array<{
    title: string;
    issueCount: number;
    projectCount: number;
    seenInProjects: string[];
    recurringIssues: string[];
    recommendation: string;
  }>;
  export?: {
    fileName: string;
    title: string;
    sections: string[];
    shareText: string;
  };
};

export type InsightReportRef = {
  id: string;
  project?: string | null;
  site?: string | null;
  inspectionType?: string | null;
  reportDate?: string | null;
};

export type InsightGroupItem = {
  label: string;
  count: number;
  issueCount?: number;
  affectedInspectionCount?: number;
  projectCount?: number;
  highestSeverity?: "Low" | "Medium" | "High" | "Critical";
  severityRank?: number;
  issueIds?: string[];
  reportIds?: string[];
  reports?: InsightReportRef[];
  tableFilter?: {
    type: "rootCause" | "highRiskArea" | string;
    value: string;
  };
};

export type AiInspectionInsightsResponse = {
  title: string;
  description: string;
  filter: {
    selected: string;
    options: string[];
  };
  generatedAt: string;
  dataScope: "tenant" | "global-anonymised";
  aiAvailable?: boolean;
  fallbackMessage?: string | null;
  confidenceNote: string;
  executiveSummary: string[];
  currentProjectActions: Array<{
    issue: string;
    location: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    trade: string;
    category: string;
    evidenceRequired: string[];
    nextAction: string;
  }>;
  learningInsights: Array<{
    title: string;
    explanation: string;
    whyItMatters: string;
    howToAvoid: string[];
    relatedTrades: string[];
    relatedInspectionTypes: string[];
    severity: "Low" | "Medium" | "High" | "Critical";
  }>;
  preInspectionChecklist: Array<{
    item: string;
    reason: string;
    evidenceRequired: string[];
    priority: "Low" | "Medium" | "High" | "Critical";
    trade?: string;
    category?: string;
  }>;
  oldProjectLessons: Array<{
    lesson: string;
    seenInProjects: string[];
    pattern: string;
    recommendationForNewProjects: string;
  }>;
  repeatedPatterns: Array<{
    issue: string;
    occurrence: string;
    inspectionsAffected?: string;
    occurrenceCount?: number;
    projectCount?: number;
    inspectionCount?: number;
    relatedTrades?: string[];
    category?: string;
    highestSeverity?: "Low" | "Medium" | "High" | "Critical";
    aiRecommendation: string;
  }>;
  highRiskAreas: Array<{
    area: string;
    riskReason: string;
    recommendedAction: string;
  }>;
  rootCauses: Array<{
    cause: string;
    scope?: "current" | "historical" | "mixed";
    explanation: string;
    preventionSteps: string[];
  }>;
  historicalLessons?: Array<{
    lesson: string;
    seenInProjects: string[];
    pattern: string;
    recommendationForNewProjects: string;
  }>;
  suggestedQuestions?: string[];
  suggestedAgentQuestions: string[];
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
