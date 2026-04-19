export type DashboardMetric = {
  id:
    | "inspections"
    | "failures"
    | "failurePercentage"
    | "reinspectionPercentage"
    | "issuesPerInspection";
  label: string;
  value: number;
  suffix?: string;
  href: string;
  description: string;
};

export type LiveTrackerSummary = {
  openIssues: number;
  overdue: number;
  readyForInspection: number;
  href: string;
  description: string;
};

export type UpcomingInspectionRisk = {
  title: string;
  daysUntilInspection: number;
  likelyFailures: string[];
  href: string;
  description: string;
};

export type TopFailureDriver = {
  issue: string;
  failCount: number;
  failureShare: number;
  inspections: number;
  reinspectionRate: number;
};

export type DistributionItem = {
  label: string;
  percentage: number;
};

export type TopFailuresSection = {
  inspectionTypes: string[];
  selectedInspectionType: string;
  summary: Array<{
    label: string;
    value: string;
  }>;
  performanceTrend: {
    label: string;
    dataPoints: Array<{
      label: string;
      value: number;
    }>;
    description: string;
  };
  drivers: TopFailureDriver[];
  failureDistribution: DistributionItem[];
  recurringRisk: DistributionItem[];
  inspectionReadiness: {
    calledEarlyPercentage: number;
    description: string;
  };
  closeOutPerformance: {
    averageDaysToClose: number;
    needsReinspectionPercentage: number;
  };
};

export type InsightsPreview = {
  rootCauses: string[];
  highRiskAreas: string[];
  href: string;
  description: string;
};

const overviewMetrics: DashboardMetric[] = [
  {
    id: "inspections",
    label: "Total Inspections",
    value: 420,
    href: "/app/reports",
    description: "",
  },
  {
    id: "failures",
    label: "Total Issues Found",
    value: 1320,
    href: "/app/reports?view=failures",
    description: "",
  },
  {
    id: "failurePercentage",
    label: "Failure Rate",
    value: 39,
    suffix: "%",
    href: "/app/reports?view=failures",
    description: "",
  },
  {
    id: "reinspectionPercentage",
    label: "Reinspection Rate",
    value: 30,
    suffix: "%",
    href: "/app/tracker",
    description: "",
  },
  {
    id: "issuesPerInspection",
    label: "Average Issues per Inspection",
    value: 7.4,
    href: "/app/reports?view=issues",
    description: "",
  },
];

const liveTrackerSummary: LiveTrackerSummary = {
  openIssues: 12,
  overdue: 3,
  readyForInspection: 5,
  href: "/app/tracker",
  description:
    "Keep track of open items, overdue actions, and work that is ready for inspection.",
};

const upcomingInspectionRisk: UpcomingInspectionRisk = {
  title: "Hydraulic inspection",
  daysUntilInspection: 5,
  likelyFailures: [
    "Pipe penetrations",
    "Pipe supports",
    "Pressure testing",
  ],
  href: "/app/inspection-risk",
  description:
    "Use this panel to prepare teams before inspection and reduce avoidable failures.",
};

const inspectionTypeData: Record<string, Omit<TopFailuresSection, "inspectionTypes">> = {
  Hydraulic: {
    selectedInspectionType: "Hydraulic",
    summary: [
      { label: "Inspection Type", value: "Hydraulic" },
      { label: "Inspections Reviewed", value: "20" },
      { label: "Failure Rate", value: "39%" },
      { label: "Repeat Issue Risk", value: "55%" },
    ],
    performanceTrend: {
      label: "Failure Rate Over Time",
      dataPoints: [
        { label: "W1", value: 24 },
        { label: "W2", value: 31 },
        { label: "W3", value: 28 },
        { label: "W4", value: 36 },
        { label: "W5", value: 33 },
        { label: "W6", value: 39 },
        { label: "W7", value: 35 },
      ],
      description: "Inspection results across recent review periods.",
    },
    drivers: [
      {
        issue: "Pipe penetrations",
        failCount: 43,
        failureShare: 21,
        inspections: 17,
        reinspectionRate: 42,
      },
      {
        issue: "Pipe supports",
        failCount: 60,
        failureShare: 29,
        inspections: 20,
        reinspectionRate: 37,
      },
      {
        issue: "Pressure testing",
        failCount: 50,
        failureShare: 24,
        inspections: 18,
        reinspectionRate: 18,
      },
    ],
    failureDistribution: [
      { label: "Pipe Supports", percentage: 29 },
      { label: "Pressure Testing", percentage: 24 },
      { label: "Pipe Penetrations", percentage: 21 },
      { label: "Other", percentage: 26 },
    ],
    recurringRisk: [
      { label: "Pipe penetrations", percentage: 65 },
      { label: "Pipe supports", percentage: 55 },
      { label: "Pressure testing", percentage: 49 },
    ],
    inspectionReadiness: {
      calledEarlyPercentage: 30,
      description:
        "The percentage of inspections raised before work was fully ready to be checked.",
    },
    closeOutPerformance: {
      averageDaysToClose: 10,
      needsReinspectionPercentage: 30,
    },
  },
  Electrical: {
    selectedInspectionType: "Electrical",
    summary: [
      { label: "Inspection Type", value: "Electrical" },
      { label: "Inspections Reviewed", value: "18" },
      { label: "Failure Rate", value: "33%" },
      { label: "Repeat Issue Risk", value: "41%" },
    ],
    performanceTrend: {
      label: "Failure Rate Over Time",
      dataPoints: [
        { label: "W1", value: 20 },
        { label: "W2", value: 26 },
        { label: "W3", value: 24 },
        { label: "W4", value: 30 },
        { label: "W5", value: 29 },
        { label: "W6", value: 33 },
        { label: "W7", value: 31 },
      ],
      description: "Inspection results across recent review periods.",
    },
    drivers: [
      {
        issue: "Cable support spacing",
        failCount: 34,
        failureShare: 25,
        inspections: 14,
        reinspectionRate: 31,
      },
      {
        issue: "Panel labelling",
        failCount: 29,
        failureShare: 21,
        inspections: 11,
        reinspectionRate: 24,
      },
      {
        issue: "Conduit sealing",
        failCount: 25,
        failureShare: 18,
        inspections: 10,
        reinspectionRate: 19,
      },
    ],
    failureDistribution: [
      { label: "Cable Support", percentage: 25 },
      { label: "Panel Labelling", percentage: 21 },
      { label: "Conduit Sealing", percentage: 18 },
      { label: "Other", percentage: 36 },
    ],
    recurringRisk: [
      { label: "Cable support spacing", percentage: 58 },
      { label: "Panel labelling", percentage: 44 },
      { label: "Conduit sealing", percentage: 37 },
    ],
    inspectionReadiness: {
      calledEarlyPercentage: 22,
      description:
        "The percentage of inspections raised before work was fully ready to be checked.",
    },
    closeOutPerformance: {
      averageDaysToClose: 8,
      needsReinspectionPercentage: 22,
    },
  },
  "Fire Safety": {
    selectedInspectionType: "Fire Safety",
    summary: [
      { label: "Inspection Type", value: "Fire Safety" },
      { label: "Inspections Reviewed", value: "16" },
      { label: "Failure Rate", value: "28%" },
      { label: "Repeat Issue Risk", value: "34%" },
    ],
    performanceTrend: {
      label: "Failure Rate Over Time",
      dataPoints: [
        { label: "W1", value: 18 },
        { label: "W2", value: 22 },
        { label: "W3", value: 24 },
        { label: "W4", value: 21 },
        { label: "W5", value: 26 },
        { label: "W6", value: 28 },
        { label: "W7", value: 25 },
      ],
      description: "Inspection results across recent review periods.",
    },
    drivers: [
      {
        issue: "Fire-stopping gaps",
        failCount: 27,
        failureShare: 26,
        inspections: 12,
        reinspectionRate: 29,
      },
      {
        issue: "Access panel sealing",
        failCount: 21,
        failureShare: 20,
        inspections: 9,
        reinspectionRate: 23,
      },
      {
        issue: "Signage visibility",
        failCount: 16,
        failureShare: 15,
        inspections: 7,
        reinspectionRate: 12,
      },
    ],
    failureDistribution: [
      { label: "Fire-stopping", percentage: 26 },
      { label: "Access Panels", percentage: 20 },
      { label: "Signage", percentage: 15 },
      { label: "Other", percentage: 39 },
    ],
    recurringRisk: [
      { label: "Fire-stopping gaps", percentage: 47 },
      { label: "Access panel sealing", percentage: 39 },
      { label: "Signage visibility", percentage: 28 },
    ],
    inspectionReadiness: {
      calledEarlyPercentage: 18,
      description:
        "The percentage of inspections raised before work was fully ready to be checked.",
    },
    closeOutPerformance: {
      averageDaysToClose: 7,
      needsReinspectionPercentage: 18,
    },
  },
};

const insightsPreview: InsightsPreview = {
  rootCauses: [
    "Work incomplete",
    "Documentation missing",
    "Trade coordination",
  ],
  highRiskAreas: [
    "Service penetrations",
    "Risers",
    "Ceiling service zones",
  ],
  href: "/app/reports?view=insights",
  description:
    "A quick summary of the main causes of failures and the areas needing closer attention.",
};

export function getDashboardOverview() {
  return overviewMetrics;
}

export function getDashboardLiveTracker() {
  return liveTrackerSummary;
}

export function getDashboardUpcomingRisk() {
  return upcomingInspectionRisk;
}

export function getDashboardTopFailures(type?: string) {
  const inspectionTypes = Object.keys(inspectionTypeData);
  const selectedType =
    type && inspectionTypeData[type] ? type : inspectionTypes[0];

  return {
    inspectionTypes,
    ...inspectionTypeData[selectedType],
  };
}

export function getDashboardInsightsPreview() {
  return insightsPreview;
}
