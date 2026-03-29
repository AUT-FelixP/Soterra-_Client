export type InspectionRiskLevel = "High" | "Medium" | "Low";

export type InspectionRiskRow = {
  id: string;
  type: string;
  site: string;
  expectedDate: string;
  daysAway: number;
  riskLevel: InspectionRiskLevel;
  actionLabel: string;
};

export type LikelyFailureItem = {
  issue: string;
  historicalFailCount: number;
  failureShare: number;
};

export type InspectionRiskResponse = {
  title: string;
  description: string;
  filters: {
    sites: string[];
    dateRanges: Array<{
      label: string;
      value: string;
    }>;
    selectedSite: string;
    selectedDateRange: string;
    inspectionTypes: string[];
    selectedInspectionType: string;
  };
  upcomingInspections: InspectionRiskRow[];
  likelyFailureItems: LikelyFailureItem[];
};

const dateRanges = [
  { label: "Next 30 days", value: "30d", maxDays: 30 },
  { label: "Next 60 days", value: "60d", maxDays: 60 },
  { label: "Next 90 days", value: "90d", maxDays: 90 },
] as const;

const inspectionRows: InspectionRiskRow[] = [
  {
    id: "hydraulic-bayfront",
    type: "Hydraulic",
    site: "Bayfront Site A",
    expectedDate: "2026-04-12",
    daysAway: 5,
    riskLevel: "High",
    actionLabel: "Export Inspection Insights",
  },
  {
    id: "fire-bayfront",
    type: "Fire",
    site: "Bayfront Site A",
    expectedDate: "2026-04-18",
    daysAway: 11,
    riskLevel: "Medium",
    actionLabel: "Export Inspection Insights",
  },
  {
    id: "preline-bayfront",
    type: "Preline",
    site: "Bayfront Site A",
    expectedDate: "2026-04-24",
    daysAway: 17,
    riskLevel: "Medium",
    actionLabel: "Export Inspection Insights",
  },
  {
    id: "electrical-campus",
    type: "Electrical",
    site: "Campus Block 2",
    expectedDate: "2026-04-10",
    daysAway: 3,
    riskLevel: "High",
    actionLabel: "Export Inspection Insights",
  },
  {
    id: "fire-campus",
    type: "Fire",
    site: "Campus Block 2",
    expectedDate: "2026-04-21",
    daysAway: 14,
    riskLevel: "Medium",
    actionLabel: "Export Inspection Insights",
  },
  {
    id: "hydraulic-level5",
    type: "Hydraulic",
    site: "Level 5 Fit-out",
    expectedDate: "2026-04-16",
    daysAway: 9,
    riskLevel: "Medium",
    actionLabel: "Export Inspection Insights",
  },
];

const likelyFailureItemsByType: Record<string, LikelyFailureItem[]> = {
  Hydraulic: [
    { issue: "Pipe penetrations", historicalFailCount: 43, failureShare: 21 },
    { issue: "Pipe supports", historicalFailCount: 60, failureShare: 29 },
    { issue: "Pressure testing", historicalFailCount: 50, failureShare: 24 },
  ],
  Fire: [
    { issue: "Fire-stopping gaps", historicalFailCount: 31, failureShare: 27 },
    { issue: "Access panel sealing", historicalFailCount: 22, failureShare: 19 },
    { issue: "Signage visibility", historicalFailCount: 18, failureShare: 16 },
  ],
  Preline: [
    { issue: "Framing clearance", historicalFailCount: 28, failureShare: 23 },
    { issue: "Service spacing", historicalFailCount: 24, failureShare: 20 },
    { issue: "Bracket alignment", historicalFailCount: 19, failureShare: 15 },
  ],
  Electrical: [
    { issue: "Cable support spacing", historicalFailCount: 34, failureShare: 25 },
    { issue: "Panel labelling", historicalFailCount: 29, failureShare: 21 },
    { issue: "Conduit sealing", historicalFailCount: 25, failureShare: 18 },
  ],
};

export function getInspectionRiskData(input?: {
  site?: string;
  dateRange?: string;
  inspectionType?: string;
}): InspectionRiskResponse {
  const sites = ["All Sites", ...new Set(inspectionRows.map((row) => row.site))];
  const selectedSite =
    input?.site && sites.includes(input.site) ? input.site : sites[0];
  const selectedDateRange =
    input?.dateRange && dateRanges.some((range) => range.value === input.dateRange)
      ? input.dateRange
      : dateRanges[0].value;
  const selectedRange =
    dateRanges.find((range) => range.value === selectedDateRange) ?? dateRanges[0];

  const filteredInspections = inspectionRows.filter((row) => {
    const matchesSite = selectedSite === "All Sites" || row.site === selectedSite;
    const matchesDateRange = row.daysAway <= selectedRange.maxDays;
    return matchesSite && matchesDateRange;
  });

  const inspectionTypes = Array.from(
    new Set(filteredInspections.map((row) => row.type))
  );

  const selectedInspectionType =
    input?.inspectionType && inspectionTypes.includes(input.inspectionType)
      ? input.inspectionType
      : inspectionTypes[0] ?? Object.keys(likelyFailureItemsByType)[0];

  return {
    title: "Upcoming Inspection Risk",
    description: "Based on upcoming work and past inspection results.",
    filters: {
      sites,
      dateRanges: dateRanges.map(({ label, value }) => ({ label, value })),
      selectedSite,
      selectedDateRange,
      inspectionTypes,
      selectedInspectionType,
    },
    upcomingInspections: filteredInspections,
    likelyFailureItems: likelyFailureItemsByType[selectedInspectionType] ?? [],
  };
}
