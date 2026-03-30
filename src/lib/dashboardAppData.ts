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
    reinspectionRate: string;
  }>;
  failureDistribution: Array<{ label: string; value: number }>;
  recurringRisk: Array<{
    label: string;
    value: number;
    tone?: "critical" | "warning" | "success";
  }>;
  inspectionReadiness: {
    value: string;
    description: string;
  };
  closeOutPerformance: Array<{ label: string; value: string }>;
};

export type DashboardCompanyResponse = {
  title: string;
  description: string;
  metrics: DashboardOverviewResponse["metrics"];
  projects: Array<{
    slug: string;
    name: string;
    inspections: number;
    failureRate: string;
    reinspectionRate: string;
    issuesPerInspection: string;
  }>;
  failureTrend: Array<{ label: string; value: number; formattedValue: string }>;
  issuesTrend: Array<{ label: string; value: number; formattedValue: string }>;
  inspectionTypes: Array<{
    type: string;
    inspections: number;
    failureRate: string;
    reinspectionRate: string;
    issuesPerInspection: string;
    tone?: "default" | "critical" | "warning" | "success";
  }>;
  adoptionImpact: Array<{ label: string; value: string; tone?: "critical" | "success" }>;
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
    reinspectionRate: string;
  }>;
  recurringRisks: Array<{
    issue: string;
    recurrenceLikelihood: string;
    repeatInstances: string;
    earlyCloseOutEffect: string;
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
    trend: "Increasing" | "Stable" | "Improving";
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

const baseMetrics: DashboardOverviewResponse["metrics"] = [
  { label: "Inspections", value: "420" },
  { label: "Failed items", value: "1,320" },
  { label: "Failure rate", value: "64%", tone: "critical" },
  { label: "Reinspection %", value: "30%", tone: "warning" },
  { label: "Issues / inspection", value: "7.4" },
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const projectRows: DashboardCompanyResponse["projects"] = [
  {
    slug: "harbor-view-tower",
    name: "Harbor View Tower",
    inspections: 45,
    failureRate: "68%",
    reinspectionRate: "35%",
    issuesPerInspection: "8.2",
  },
  {
    slug: "north-ridge-schools",
    name: "North Ridge Schools",
    inspections: 38,
    failureRate: "52%",
    reinspectionRate: "22%",
    issuesPerInspection: "6.1",
  },
  {
    slug: "union-rail-depot",
    name: "Union Rail Depot",
    inspections: 51,
    failureRate: "61%",
    reinspectionRate: "30%",
    issuesPerInspection: "7.0",
  },
];

const riskInspectionCatalog = [
  {
    id: "hydraulic-bayfront",
    type: "Hydraulic",
    site: "Bayfront Site A",
    expectedDate: "2026-04-12",
    daysAway: 5,
    riskLevel: "High" as const,
  },
  {
    id: "fire-bayfront",
    type: "Fire",
    site: "Bayfront Site A",
    expectedDate: "2026-04-18",
    daysAway: 11,
    riskLevel: "Medium" as const,
  },
  {
    id: "preline-campus",
    type: "Preline",
    site: "Campus Block 2",
    expectedDate: "2026-04-24",
    daysAway: 17,
    riskLevel: "Medium" as const,
  },
  {
    id: "structural-platform",
    type: "Structural",
    site: "Platform Expansion",
    expectedDate: "2026-05-02",
    daysAway: 25,
    riskLevel: "Low" as const,
  },
];

const likelyFailuresByInspectionId: Record<
  string,
  DashboardRiskResponse["likelyFailures"]
> = {
  "hydraulic-bayfront": [
    {
      issue: "Pipe supports & fixings",
      historicalFailCount: 60,
      failureShare: "29%",
      recurrenceLikelihood: "65%",
      tone: "critical",
    },
    {
      issue: "Pressure testing & leaks",
      historicalFailCount: 50,
      failureShare: "24%",
      recurrenceLikelihood: "55%",
      tone: "warning",
    },
    {
      issue: "Pipe penetrations",
      historicalFailCount: 43,
      failureShare: "21%",
      recurrenceLikelihood: "49%",
      tone: "warning",
    },
    {
      issue: "Seismic restraints",
      historicalFailCount: 16,
      failureShare: "8%",
      recurrenceLikelihood: "44%",
      tone: "warning",
    },
    {
      issue: "Incorrect pipe falls",
      historicalFailCount: 14,
      failureShare: "7%",
      recurrenceLikelihood: "43%",
      tone: "success",
    },
  ],
  "fire-bayfront": [
    {
      issue: "Fire stopping gaps",
      historicalFailCount: 27,
      failureShare: "26%",
      recurrenceLikelihood: "47%",
      tone: "warning",
    },
    {
      issue: "Access panel sealing",
      historicalFailCount: 21,
      failureShare: "20%",
      recurrenceLikelihood: "39%",
      tone: "warning",
    },
    {
      issue: "Signage visibility",
      historicalFailCount: 16,
      failureShare: "15%",
      recurrenceLikelihood: "28%",
      tone: "success",
    },
  ],
  "preline-campus": [
    {
      issue: "Trade coordination at penetrations",
      historicalFailCount: 19,
      failureShare: "32%",
      recurrenceLikelihood: "51%",
      tone: "critical",
    },
    {
      issue: "Documentation not available on site",
      historicalFailCount: 14,
      failureShare: "24%",
      recurrenceLikelihood: "31%",
      tone: "warning",
    },
    {
      issue: "Site not ready for inspection",
      historicalFailCount: 11,
      failureShare: "18%",
      recurrenceLikelihood: "27%",
      tone: "success",
    },
  ],
  "structural-platform": [
    {
      issue: "Seismic restraints",
      historicalFailCount: 16,
      failureShare: "18%",
      recurrenceLikelihood: "22%",
      tone: "success",
    },
    {
      issue: "Embed placement checks",
      historicalFailCount: 9,
      failureShare: "12%",
      recurrenceLikelihood: "19%",
      tone: "success",
    },
  ],
};

export function getDashboardOverviewPage(): DashboardOverviewResponse {
  return {
    title: "Dashboard",
    description: "Performance overview across all inspection data.",
    metrics: baseMetrics,
    liveTracker: {
      openIssues: 12,
      overdue: 3,
      readyForInspection: 5,
      href: "/app/tracker",
    },
    performanceTrend: [
      { label: monthLabels[0], value: 72, formattedValue: "72%" },
      { label: monthLabels[1], value: 68, formattedValue: "68%" },
      { label: monthLabels[2], value: 70, formattedValue: "70%" },
      { label: monthLabels[3], value: 65, formattedValue: "65%" },
      { label: monthLabels[4], value: 67, formattedValue: "67%" },
      { label: monthLabels[5], value: 62, formattedValue: "62%" },
      { label: monthLabels[6], value: 58, formattedValue: "58%" },
    ],
    upcomingRisks: [
      {
        title: "Hydraulic inspection",
        subtitle: "Likely: pipe penetrations, pipe supports, pressure testing",
        daysAway: 5,
        level: "High",
      },
      {
        title: "Fire inspection",
        subtitle: "Likely: fire stopping gaps, penetrations",
        daysAway: 11,
        level: "Medium",
      },
    ],
    topFailureDrivers: [
      {
        issue: "Pipe supports & fixings",
        failCount: 60,
        failureShare: "29%",
        inspections: 20,
        reinspectionRate: "37%",
      },
      {
        issue: "Pressure testing & leaks",
        failCount: 50,
        failureShare: "24%",
        inspections: 18,
        reinspectionRate: "18%",
      },
      {
        issue: "Pipe penetrations",
        failCount: 43,
        failureShare: "21%",
        inspections: 17,
        reinspectionRate: "42%",
      },
      {
        issue: "Seismic restraints",
        failCount: 16,
        failureShare: "8%",
        inspections: 10,
        reinspectionRate: "44%",
      },
      {
        issue: "Incorrect pipe falls",
        failCount: 14,
        failureShare: "7%",
        inspections: 9,
        reinspectionRate: "43%",
      },
    ],
    failureDistribution: [
      { label: "Pipe supports", value: 29 },
      { label: "Pressure testing", value: 24 },
      { label: "Pipe penetrations", value: 21 },
      { label: "Other", value: 26 },
    ],
    recurringRisk: [
      { label: "Pipe penetrations", value: 65, tone: "critical" },
      { label: "Pipe supports", value: 55, tone: "warning" },
      { label: "Pressure testing", value: 49, tone: "warning" },
      { label: "Seismic restraints", value: 44, tone: "warning" },
    ],
    inspectionReadiness: {
      value: "30%",
      description: "of inspections called with outstanding works or documentation",
    },
    closeOutPerformance: [
      { label: "Avg days to close", value: "10" },
      { label: "Need reinspection", value: "30%" },
    ],
  };
}

export function getDashboardCompanyPage(): DashboardCompanyResponse {
  return {
    title: "Company performance",
    description: "Aggregate performance across all projects.",
    metrics: baseMetrics,
    projects: projectRows,
    failureTrend: [
      { label: "Jan", value: 72, formattedValue: "72%" },
      { label: "Feb", value: 68, formattedValue: "68%" },
      { label: "Mar", value: 70, formattedValue: "70%" },
      { label: "Apr", value: 65, formattedValue: "65%" },
      { label: "May", value: 67, formattedValue: "67%" },
      { label: "Jun", value: 62, formattedValue: "62%" },
      { label: "Jul", value: 58, formattedValue: "58%" },
    ],
    issuesTrend: [
      { label: "Jan", value: 81, formattedValue: "8.1" },
      { label: "Feb", value: 79, formattedValue: "7.9" },
      { label: "Mar", value: 80, formattedValue: "8.0" },
      { label: "Apr", value: 77, formattedValue: "7.7" },
      { label: "May", value: 75, formattedValue: "7.5" },
      { label: "Jun", value: 73, formattedValue: "7.3" },
      { label: "Jul", value: 70, formattedValue: "7.0" },
    ],
    inspectionTypes: [
      {
        type: "Hydraulic",
        inspections: 120,
        failureRate: "72%",
        reinspectionRate: "38%",
        issuesPerInspection: "8.5",
        tone: "critical",
      },
      {
        type: "Structural",
        inspections: 90,
        failureRate: "55%",
        reinspectionRate: "25%",
        issuesPerInspection: "6.3",
      },
      {
        type: "Electrical",
        inspections: 60,
        failureRate: "51%",
        reinspectionRate: "27%",
        issuesPerInspection: "6.0",
      },
      {
        type: "Fire",
        inspections: 70,
        failureRate: "48%",
        reinspectionRate: "20%",
        issuesPerInspection: "5.8",
        tone: "success",
      },
    ],
    adoptionImpact: [
      { label: "Before — failure rate", value: "72%", tone: "critical" },
      { label: "After — failure rate", value: "64%", tone: "success" },
      { label: "Improvement", value: "↓ 8%" },
    ],
  };
}

export function getDashboardPerformancePage(
  inspectionType = "All types"
): DashboardPerformanceResponse {
  return {
    title: "Performance analysis",
    description: "Deep failure patterns across all historical inspection data.",
    filter: {
      selected: inspectionType,
      options: ["All types", "Hydraulic", "Fire", "Structural"],
    },
    topFailureDrivers: [
      {
        rank: 1,
        issue: "Pipe supports & fixings",
        failCount: 60,
        failureShare: "29%",
        inspectionsAffected: "20 / 28",
        reinspectionRate: "37%",
      },
      {
        rank: 2,
        issue: "Pressure testing & leaks",
        failCount: 50,
        failureShare: "24%",
        inspectionsAffected: "18 / 28",
        reinspectionRate: "18%",
      },
      {
        rank: 3,
        issue: "Pipe penetrations",
        failCount: 43,
        failureShare: "21%",
        inspectionsAffected: "17 / 28",
        reinspectionRate: "42%",
      },
      {
        rank: 4,
        issue: "Seismic restraints",
        failCount: 16,
        failureShare: "8%",
        inspectionsAffected: "10 / 28",
        reinspectionRate: "44%",
      },
      {
        rank: 5,
        issue: "Incorrect pipe falls",
        failCount: 14,
        failureShare: "7%",
        inspectionsAffected: "9 / 28",
        reinspectionRate: "43%",
      },
      {
        rank: 6,
        issue: "Poor coordination at penetrations",
        failCount: 9,
        failureShare: "4%",
        inspectionsAffected: "7 / 28",
        reinspectionRate: "33%",
      },
      {
        rank: 7,
        issue: "Site not ready for inspection",
        failCount: 7,
        failureShare: "3%",
        inspectionsAffected: "7 / 28",
        reinspectionRate: "28%",
      },
      {
        rank: 8,
        issue: "Valves inaccessible",
        failCount: 6,
        failureShare: "3%",
        inspectionsAffected: "6 / 28",
        reinspectionRate: "25%",
      },
    ],
    recurringRisks: [
      {
        issue: "Pipe penetrations",
        recurrenceLikelihood: "65%",
        repeatInstances: "18 of 43",
        earlyCloseOutEffect: "12–18% if closed within 10 days",
        tone: "critical",
      },
      {
        issue: "Pipe supports",
        recurrenceLikelihood: "55%",
        repeatInstances: "22 of 60",
        earlyCloseOutEffect: "15–20% if closed within 10 days",
        tone: "warning",
      },
      {
        issue: "Pressure testing",
        recurrenceLikelihood: "49%",
        repeatInstances: "9 of 50",
        earlyCloseOutEffect: "10–15% if closed within 10 days",
        tone: "warning",
      },
      {
        issue: "Seismic restraints",
        recurrenceLikelihood: "44%",
        repeatInstances: "7 of 16",
        earlyCloseOutEffect: "18–22% if closed within 10 days",
        tone: "warning",
      },
      {
        issue: "Incorrect pipe falls",
        recurrenceLikelihood: "43%",
        repeatInstances: "6 of 14",
        earlyCloseOutEffect: "20–25% if closed within 10 days",
        tone: "success",
      },
    ],
    recurrenceSummary:
      "Issues closed within 7–10 days show 12–18% recurrence. Issues left open beyond 14 days show 35–45% recurrence.",
  };
}

export function getDashboardInsightsPage(
  inspectionType = "All inspection types"
): DashboardInsightsResponse {
  return {
    title: "Insights",
    description: "Key learnings from historical inspection data.",
    filter: {
      selected: inspectionType,
      options: [
        "All inspection types",
        "Hydraulic",
        "Fire",
        "Structural",
        "Electrical",
      ],
    },
    rootCauses: [
      "Work incomplete at time of inspection",
      "Documentation missing or unavailable",
      "Trade coordination failures",
      "Installation not to specification",
      "Access restricted once finishes installed",
    ],
    highRiskAreas: [
      "Service penetrations through fire-rated elements",
      "Risers, cupboards & service zones",
      "Ceiling spaces with multiple services",
      "Plant rooms",
      "Basement suspended services",
    ],
    repeatedPatterns: [
      {
        issue: "Pipe penetrations not sealed",
        occurrence: "68%",
        trend: "Increasing",
      },
      {
        issue: "Pipe supports missing or incorrect spacing",
        occurrence: "55%",
        trend: "Stable",
      },
      {
        issue: "Pressure testing incomplete at inspection",
        occurrence: "49%",
        trend: "Improving",
      },
      {
        issue: "Fire stopping gaps",
        occurrence: "44%",
        trend: "Stable",
      },
      {
        issue: "Cable clearance issues",
        occurrence: "39%",
        trend: "Improving",
      },
      {
        issue: "Earth bonding not provided",
        occurrence: "35%",
        trend: "Stable",
      },
      {
        issue: "Seismic restraints inadequate",
        occurrence: "32%",
        trend: "Increasing",
      },
      {
        issue: "Documentation not available on site",
        occurrence: "28%",
        trend: "Improving",
      },
    ],
  };
}

export function getDashboardRiskPage(
  site = "All sites",
  window = "30d",
  inspectionId?: string
): DashboardRiskResponse {
  const filteredInspections = riskInspectionCatalog.filter((item) => {
    if (site !== "All sites" && item.site !== site) {
      return false;
    }
    if (window === "14d") {
      return item.daysAway <= 14;
    }
    if (window === "60d") {
      return item.daysAway <= 60;
    }
    return item.daysAway <= 30;
  });

  const selectedInspection =
    filteredInspections.find((item) => item.id === inspectionId) ??
    filteredInspections[0] ??
    riskInspectionCatalog[0];
  const likelyFailures =
    likelyFailuresByInspectionId[selectedInspection.id] ??
    likelyFailuresByInspectionId["hydraulic-bayfront"];

  return {
    title: "Upcoming inspection risk",
    description: "Predicted risks based on programme dates and historical failure data.",
    filters: {
      sites: ["All sites", "Bayfront Site A", "Campus Block 2", "Platform Expansion"],
      selectedSite: site,
      windows: [
        { label: "Next 30 days", value: "30d" },
        { label: "Next 14 days", value: "14d" },
        { label: "Next 60 days", value: "60d" },
      ],
      selectedWindow: window,
    },
    inspections: filteredInspections,
    selectedInspectionId: selectedInspection.id,
    likelyFailureTitle: `${selectedInspection.type} — likely failure items`,
    likelyFailureSubtitle: `Based on ${likelyFailures.length + 23} inspections across 7 projects`,
    likelyFailures,
  };
}

export function getDashboardProjectPage(
  slug: string
): DashboardProjectResponse | null {
  if (slug !== "harbor-view-tower") {
    return null;
  }

  return {
    title: "Project performance — Harbor View Tower",
    description: "Site: Bayfront Site A",
    metrics: [
      { label: "Inspections", value: "45" },
      { label: "Failure rate", value: "68%", tone: "critical" },
      { label: "Issues / inspection", value: "8.2" },
    ],
    trackerSnapshot: {
      open: 12,
      ready: 5,
      closedLast7Days: 8,
      href: "/app/tracker",
    },
    openItemsByType: [
      { label: "Hydraulic", value: "5" },
      { label: "Fire", value: "3" },
      { label: "Structural", value: "2" },
      { label: "Electrical", value: "2" },
    ],
    topFailureDrivers: [
      { issue: "Pipe penetrations", count: 18, failShare: "26%" },
      { issue: "Pipe supports", count: 14, failShare: "21%" },
      { issue: "Pressure testing", count: 11, failShare: "16%" },
    ],
    versusCompanyAverage: [
      {
        label: "Failure rate",
        projectValue: "68%",
        companyValue: "64%",
        deltaLabel: "Higher",
        tone: "critical",
      },
      {
        label: "Issues / inspection",
        projectValue: "8.2",
        companyValue: "7.4",
        deltaLabel: "Higher",
        tone: "critical",
      },
    ],
    recentFailedItems: [
      {
        id: "issue-001",
        issue: "Pipe penetration not sealed",
        type: "Hydraulic",
        date: "03 Feb",
        status: "Open",
      },
      {
        id: "issue-002",
        issue: "Missing pipe supports",
        type: "Hydraulic",
        date: "03 Feb",
        status: "Open",
      },
      {
        id: "issue-003",
        issue: "Fire stopping gap",
        type: "Fire",
        date: "02 Feb",
        status: "Open",
      },
    ],
  };
}
