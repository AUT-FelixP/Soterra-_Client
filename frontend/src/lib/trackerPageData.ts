export type TrackerIssueStatus = "Open" | "Ready" | "Closed";
export type TrackerIssueType =
  | "Hydraulic"
  | "Structural"
  | "Fire"
  | "Electrical";
export type TrackerDateRange = "7d" | "14d" | "30d";
export type TrackerLastSentTo = "subcontractor" | "consultant";
export type InspectionMatrixStatus =
  | "not_started"
  | "failed"
  | "ready"
  | "passed";

export type TrackerIssueRecord = {
  id: string;
  issue: string;
  site: string;
  type: TrackerIssueType;
  dateIdentified: string;
  status: TrackerIssueStatus;
  reinspections: number;
  inspectionNote: string;
  subcontractorName: string;
  subcontractorEmail: string;
  consultantName: string;
  consultantEmail: string;
  closedAt?: string;
  lastSentTo?: TrackerLastSentTo;
};

export type TrackerIssueRow = {
  id: string;
  issue: string;
  site?: string;
  type: TrackerIssueType;
  dateIdentified: string;
  daysOpen: number;
  status: TrackerIssueStatus;
};

export type TrackerIssueDetail = {
  id: string;
  issue: string;
  site: string;
  type: TrackerIssueType;
  dateIdentified: string;
  daysOpen: number;
  status: TrackerIssueStatus;
  inspectionNote: string;
  reinspections: number;
  subcontractorName: string;
  subcontractorEmail: string;
  consultantName: string;
  consultantEmail: string;
  lastSentTo?: TrackerLastSentTo;
};

export type TrackerPageResponse = {
  title: "Live Tracker";
  description: "Open inspection issues extracted from reports.";
  controls: {
    sites: string[];
    selectedSite: string;
    search: string;
    exportFileName: string;
  };
  summary: {
    open: number;
    readyForInspection: number;
    closedLast7Days: number;
  };
  inspectionStatusTracker: {
    siteLabel: string;
    overview: string;
    lots: string[];
    rows: Array<{
      inspectionType: string;
      cells: Array<{
        lot: string;
        status: InspectionMatrixStatus;
      }>;
    }>;
    progress: Array<{
      lot: string;
      percent: number;
      currentStage: string;
      currentStatus: InspectionMatrixStatus;
      completedStages: number;
      totalStages: number;
    }>;
  };
  filters: {
    statuses: Array<"All" | TrackerIssueStatus>;
    types: Array<"All" | TrackerIssueType>;
    dateRanges: Array<{ label: string; value: TrackerDateRange }>;
    selectedStatus: "All" | TrackerIssueStatus;
    selectedType: "All" | TrackerIssueType;
    selectedDateRange: TrackerDateRange;
  };
  issueRegister: {
    siteSelected: boolean;
    columns: string[];
    items: TrackerIssueRow[];
  };
  selectedIssue: TrackerIssueDetail | null;
};

const STATUS_OPTIONS: Array<"All" | TrackerIssueStatus> = [
  "All",
  "Open",
  "Ready",
  "Closed",
];
const TYPE_OPTIONS: Array<"All" | TrackerIssueType> = [
  "All",
  "Hydraulic",
  "Structural",
  "Fire",
  "Electrical",
];
const DATE_RANGE_OPTIONS: Array<{ label: string; value: TrackerDateRange }> = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
];

const inspectionMatrixTemplates: Record<
  string,
  {
    siteLabel: string;
    lots: string[];
    rows: Array<{
      inspectionType: string;
      statuses: InspectionMatrixStatus[];
    }>;
  }
> = {
  "Bayfront Site A": {
    siteLabel: "Bayfront Site A",
    lots: ["Lot 1", "Lot 2", "Lot 3", "Lot 4", "Lot 5", "Lot 6", "Lot 7", "Lot 8"],
    rows: [
      { inspectionType: "Earthworks", statuses: ["passed", "passed", "passed", "ready", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Foundations", statuses: ["passed", "passed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Slab", statuses: ["passed", "passed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Framing", statuses: ["passed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Services)", statuses: ["failed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Insulation", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
      { inspectionType: "Preline (Board)", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
      { inspectionType: "Waterproofing", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
      { inspectionType: "Cladding", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
      { inspectionType: "Final", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
    ],
  },
  "Campus Block 2": {
    siteLabel: "Campus Block 2",
    lots: ["Lot 1", "Lot 2", "Lot 3", "Lot 4", "Lot 5", "Lot 6", "Lot 7", "Lot 8"],
    rows: [
      { inspectionType: "Earthworks", statuses: ["passed", "passed", "passed", "passed", "ready", "not_started", "not_started", "not_started"] },
      { inspectionType: "Foundations", statuses: ["passed", "passed", "passed", "ready", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Slab", statuses: ["passed", "passed", "ready", "ready", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Framing", statuses: ["ready", "ready", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Services)", statuses: ["failed", "ready", "ready", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Insulation", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Board)", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Waterproofing", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Cladding", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Final", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
    ],
  },
  "Level 5 Fit-out": {
    siteLabel: "Level 5 Fit-out",
    lots: ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F"],
    rows: [
      { inspectionType: "Earthworks", statuses: ["passed", "passed", "passed", "passed", "passed", "passed"] },
      { inspectionType: "Foundations", statuses: ["passed", "passed", "passed", "passed", "passed", "passed"] },
      { inspectionType: "Slab", statuses: ["passed", "passed", "passed", "passed", "passed", "passed"] },
      { inspectionType: "Framing", statuses: ["passed", "passed", "ready", "ready", "not_started", "not_started"] },
      { inspectionType: "Preline (Services)", statuses: ["ready", "ready", "failed", "not_started", "not_started", "not_started"] },
      { inspectionType: "Insulation", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Board)", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Waterproofing", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Cladding", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Final", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
    ],
  },
  "Tower B Podium": {
    siteLabel: "Tower B Podium",
    lots: ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"],
    rows: [
      { inspectionType: "Earthworks", statuses: ["passed", "passed", "passed", "passed", "passed", "not_started"] },
      { inspectionType: "Foundations", statuses: ["passed", "passed", "passed", "ready", "not_started", "not_started"] },
      { inspectionType: "Slab", statuses: ["passed", "ready", "ready", "not_started", "not_started", "not_started"] },
      { inspectionType: "Framing", statuses: ["ready", "ready", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Services)", statuses: ["failed", "ready", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Insulation", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Board)", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Waterproofing", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Cladding", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Final", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
    ],
  },
  "Warehouse 3": {
    siteLabel: "Warehouse 3",
    lots: ["Lot 1", "Lot 2", "Lot 3", "Lot 4", "Lot 5", "Lot 6"],
    rows: [
      { inspectionType: "Earthworks", statuses: ["passed", "passed", "passed", "passed", "not_started", "not_started"] },
      { inspectionType: "Foundations", statuses: ["passed", "passed", "ready", "ready", "not_started", "not_started"] },
      { inspectionType: "Slab", statuses: ["passed", "ready", "ready", "not_started", "not_started", "not_started"] },
      { inspectionType: "Framing", statuses: ["ready", "ready", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Services)", statuses: ["ready", "failed", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Insulation", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Preline (Board)", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Waterproofing", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Cladding", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
      { inspectionType: "Final", statuses: ["not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
    ],
  },
};

function getInspectionMatrix(site: string) {
  return (
    inspectionMatrixTemplates[site] ?? {
      siteLabel: "Manurewa Stage 1",
      lots: ["Lot 1", "Lot 2", "Lot 3", "Lot 4", "Lot 5", "Lot 6", "Lot 7", "Lot 8"],
      rows: [
        { inspectionType: "Earthworks", statuses: ["passed", "passed", "passed", "ready", "not_started", "not_started", "not_started", "not_started"] },
        { inspectionType: "Foundations", statuses: ["passed", "passed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started"] },
        { inspectionType: "Slab", statuses: ["passed", "passed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started"] },
        { inspectionType: "Framing", statuses: ["passed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
        { inspectionType: "Preline (Services)", statuses: ["failed", "ready", "not_started", "not_started", "not_started", "not_started", "not_started", "not_started"] },
        { inspectionType: "Insulation", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
        { inspectionType: "Preline (Board)", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
        { inspectionType: "Waterproofing", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
        { inspectionType: "Cladding", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
        { inspectionType: "Final", statuses: Array(8).fill("not_started") as InspectionMatrixStatus[] },
      ],
    }
  );
}

function getStatusProgressWeight(status: InspectionMatrixStatus) {
  if (status === "passed") {
    return 1;
  }
  if (status === "ready") {
    return 0.7;
  }
  if (status === "failed") {
    return 0.35;
  }
  return 0;
}

function buildLotProgress(matrix: ReturnType<typeof getInspectionMatrix>) {
  return matrix.lots.map((lot, lotIndex) => {
    const statuses = matrix.rows.map(
      (row) => row.statuses[lotIndex] ?? "not_started"
    );
    const weightedTotal = statuses.reduce(
      (total, status) => total + getStatusProgressWeight(status),
      0
    );
    const completedStages = statuses.filter((status) => status === "passed").length;
    const currentStageIndex = statuses.findLastIndex(
      (status) => status !== "not_started"
    );
    const currentStage =
      currentStageIndex >= 0
        ? matrix.rows[currentStageIndex].inspectionType
        : "Not started";
    const currentStatus =
      currentStageIndex >= 0 ? statuses[currentStageIndex] : "not_started";

    return {
      lot,
      percent: Math.round((weightedTotal / matrix.rows.length) * 100),
      currentStage,
      currentStatus,
      completedStages,
      totalStages: matrix.rows.length,
    };
  });
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(dayCount: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - dayCount);
  return formatIsoDate(date);
}

function makeRecord(
  id: string,
  issue: string,
  site: string,
  type: TrackerIssueType,
  status: TrackerIssueStatus,
  identifiedDaysAgo: number,
  inspectionNote: string,
  reinspections: number,
  contactKey: string,
  closedDaysAgo?: number
): TrackerIssueRecord {
  const safeKey = contactKey.toLowerCase().replace(/\s+/g, ".");

  return {
    id,
    issue,
    site,
    type,
    dateIdentified: daysAgo(identifiedDaysAgo),
    status,
    reinspections,
    inspectionNote,
    subcontractorName: `${contactKey} Subcontracting`,
    subcontractorEmail: `${safeKey}@subcontractor.example.com`,
    consultantName: `${contactKey} Consulting`,
    consultantEmail: `${safeKey}@consultant.example.com`,
    closedAt:
      status === "Closed" && typeof closedDaysAgo === "number"
        ? daysAgo(closedDaysAgo)
        : undefined,
  };
}

const trackerIssues: TrackerIssueRecord[] = [
  makeRecord(
    "trk-001",
    "Pipe penetration not sealed",
    "Bayfront Site A",
    "Hydraulic",
    "Open",
    12,
    "Penetration around pipe not sealed through rated wall.",
    1,
    "Harbor Plumbing"
  ),
  makeRecord(
    "trk-002",
    "Missing pipe supports",
    "Bayfront Site A",
    "Hydraulic",
    "Open",
    12,
    "Support spacing exceeds the approved installation standard.",
    0,
    "Harbor Plumbing"
  ),
  makeRecord(
    "trk-003",
    "Fire collar not fitted",
    "Bayfront Site A",
    "Fire",
    "Ready",
    10,
    "Service penetration requires a compliant fire collar before sign-off.",
    2,
    "Apex Fire"
  ),
  makeRecord(
    "trk-004",
    "Cable tray clearance below spec",
    "Campus Block 2",
    "Electrical",
    "Open",
    9,
    "Cable tray is installed too close to the ceiling support framing.",
    1,
    "North Wire"
  ),
  makeRecord(
    "trk-005",
    "Panel labelling incomplete",
    "Campus Block 2",
    "Electrical",
    "Open",
    6,
    "Distribution board labels do not match the issued schedule.",
    0,
    "North Wire"
  ),
  makeRecord(
    "trk-006",
    "Rebar cover below requirement",
    "Campus Block 2",
    "Structural",
    "Ready",
    8,
    "Starter bars need re-checking before the pour proceeds.",
    1,
    "Core Structural"
  ),
  makeRecord(
    "trk-007",
    "Fire-stopping gaps at riser",
    "Level 5 Fit-out",
    "Fire",
    "Open",
    5,
    "Service riser openings still show visible gaps around trays.",
    0,
    "Shield Fire"
  ),
  makeRecord(
    "trk-008",
    "Hydraulic pressure test incomplete",
    "Level 5 Fit-out",
    "Hydraulic",
    "Open",
    4,
    "Pressure test log is incomplete and cannot be signed off.",
    1,
    "Level Five Plumbing"
  ),
  makeRecord(
    "trk-009",
    "Deflection head detail missing",
    "Tower B Podium",
    "Structural",
    "Ready",
    11,
    "Head detail needs to match the approved shop drawing revision.",
    2,
    "Podium Steel"
  ),
  makeRecord(
    "trk-010",
    "Emergency lighting test not recorded",
    "Tower B Podium",
    "Electrical",
    "Open",
    3,
    "Testing paperwork is missing for the last installed emergency lighting run.",
    0,
    "Podium Electrical"
  ),
  makeRecord(
    "trk-011",
    "Pipe insulation damaged",
    "Warehouse 3",
    "Hydraulic",
    "Ready",
    14,
    "Insulation is torn at service bends and requires reinstatement.",
    1,
    "West Flow"
  ),
  makeRecord(
    "trk-012",
    "Fire damper access blocked",
    "Warehouse 3",
    "Fire",
    "Open",
    7,
    "Access panel cannot be reached due to installed framing.",
    0,
    "West Fire"
  ),
  makeRecord(
    "trk-013",
    "Pipe supports installed off centre",
    "Bayfront Site A",
    "Hydraulic",
    "Closed",
    15,
    "Support anchors have now been re-fixed to the engineer's layout.",
    1,
    "Harbor Plumbing",
    2
  ),
  makeRecord(
    "trk-014",
    "Fire-stopping patch incomplete",
    "Campus Block 2",
    "Fire",
    "Closed",
    12,
    "Patch repair has been completed and checked against the penetration register.",
    1,
    "Apex Fire",
    4
  ),
  makeRecord(
    "trk-015",
    "Conduit sealing incomplete",
    "Campus Block 2",
    "Electrical",
    "Closed",
    10,
    "Conduit penetrations are now sealed and labelled.",
    1,
    "North Wire",
    1
  ),
  makeRecord(
    "trk-016",
    "Rebar spacing corrected",
    "Level 5 Fit-out",
    "Structural",
    "Closed",
    16,
    "Spacing correction has been verified prior to cover pour.",
    0,
    "Core Structural",
    6
  ),
  makeRecord(
    "trk-017",
    "Fire seal around cable tray repaired",
    "Tower B Podium",
    "Fire",
    "Closed",
    9,
    "Repair completed and photographed for consultant review.",
    1,
    "Shield Fire",
    5
  ),
  makeRecord(
    "trk-018",
    "Hydraulic valve tag added",
    "Warehouse 3",
    "Hydraulic",
    "Closed",
    8,
    "Valve tag installed and matches commissioning schedule.",
    0,
    "West Flow",
    3
  ),
  makeRecord(
    "trk-019",
    "Electrical panel schedule updated",
    "Bayfront Site A",
    "Electrical",
    "Closed",
    6,
    "Panel schedule has been updated and reissued.",
    0,
    "Harbor Electrical",
    2
  ),
  makeRecord(
    "trk-020",
    "Fire door frame gap repaired",
    "Campus Block 2",
    "Fire",
    "Closed",
    13,
    "Frame gap repaired and photo evidence uploaded.",
    1,
    "Apex Fire",
    7
  ),
  makeRecord(
    "trk-021",
    "Hydraulic sleeve installed",
    "Level 5 Fit-out",
    "Hydraulic",
    "Open",
    2,
    "Sleeve installation is incomplete at the slab penetration.",
    0,
    "Level Five Plumbing"
  ),
  makeRecord(
    "trk-022",
    "Bracing detail not installed",
    "Tower B Podium",
    "Structural",
    "Open",
    1,
    "Brace connection detail is missing at the nominated bay.",
    0,
    "Podium Steel"
  ),
  makeRecord(
    "trk-023",
    "Cable support bracket loose",
    "Warehouse 3",
    "Electrical",
    "Ready",
    5,
    "Bracket re-fix is complete and ready for verification.",
    1,
    "West Electrical"
  ),
  makeRecord(
    "trk-024",
    "Hydrant clearance obstructed",
    "Bayfront Site A",
    "Fire",
    "Open",
    13,
    "Stored material is still blocking the required hydrant access zone.",
    0,
    "Harbor Fire"
  ),
  makeRecord(
    "trk-025",
    "Anchor bolt torque not recorded",
    "Campus Block 2",
    "Structural",
    "Ready",
    4,
    "Torque record sheet is ready for consultant verification.",
    1,
    "Core Structural"
  ),
];

function getToday() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function diffInDays(startDate: string, endDate?: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate ?? formatIsoDate(getToday())}T00:00:00Z`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay)
  );
}

function wasClosedWithinLastSevenDays(issue: TrackerIssueRecord) {
  if (issue.status !== "Closed" || !issue.closedAt) {
    return false;
  }

  return diffInDays(issue.closedAt) <= 7;
}

function matchesDateRange(issue: TrackerIssueRecord, dateRange: TrackerDateRange) {
  const limit = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
  return diffInDays(issue.dateIdentified) <= limit;
}

function toIssueRow(
  issue: TrackerIssueRecord,
  siteSelected: boolean
): TrackerIssueRow {
  return {
    id: issue.id,
    issue: issue.issue,
    site: siteSelected ? undefined : issue.site,
    type: issue.type,
    dateIdentified: issue.dateIdentified,
    daysOpen: diffInDays(
      issue.dateIdentified,
      issue.status === "Closed" ? issue.closedAt : undefined
    ),
    status: issue.status,
  };
}

function toIssueDetail(issue: TrackerIssueRecord): TrackerIssueDetail {
  return {
    id: issue.id,
    issue: issue.issue,
    site: issue.site,
    type: issue.type,
    dateIdentified: issue.dateIdentified,
    daysOpen: diffInDays(
      issue.dateIdentified,
      issue.status === "Closed" ? issue.closedAt : undefined
    ),
    status: issue.status,
    inspectionNote: issue.inspectionNote,
    reinspections: issue.reinspections,
    subcontractorName: issue.subcontractorName,
    subcontractorEmail: issue.subcontractorEmail,
    consultantName: issue.consultantName,
    consultantEmail: issue.consultantEmail,
    lastSentTo: issue.lastSentTo,
  };
}

export function getTrackerIssueById(id: string) {
  return trackerIssues.find((issue) => issue.id === id) ?? null;
}

export function getTrackerDashboardSummary() {
  return {
    openIssues: trackerIssues.filter((issue) => issue.status === "Open").length,
    overdue: trackerIssues.filter(
      (issue) => issue.status === "Open" && diffInDays(issue.dateIdentified) > 7
    ).length,
    readyForInspection: trackerIssues.filter((issue) => issue.status === "Ready")
      .length,
    href: "/app/tracker",
    description:
      "Keep track of open items, overdue actions, and work that is ready for inspection.",
  };
}

export function updateTrackerIssue(
  id: string,
  updates: {
    status?: TrackerIssueStatus;
    reinspections?: number;
    lastSentTo?: TrackerLastSentTo;
  }
) {
  const issue = getTrackerIssueById(id);

  if (!issue) {
    return null;
  }

  if (updates.status) {
    issue.status = updates.status;
    issue.closedAt =
      updates.status === "Closed" ? formatIsoDate(getToday()) : undefined;
  }

  if (typeof updates.reinspections === "number" && updates.reinspections >= 0) {
    issue.reinspections = updates.reinspections;
  }

  if (updates.lastSentTo) {
    issue.lastSentTo = updates.lastSentTo;
  }

  return issue;
}

export function getTrackerPageData(input?: {
  site?: string;
  search?: string;
  status?: string;
  type?: string;
  dateRange?: string;
  issueId?: string;
}): TrackerPageResponse {
  const sites = Array.from(new Set(trackerIssues.map((item) => item.site)));
  const selectedSite =
    input?.site && sites.includes(input.site) ? input.site : sites[0];
  const normalizedSearch = input?.search?.trim() ?? "";
  const selectedStatus = STATUS_OPTIONS.includes(
    (input?.status as "All" | TrackerIssueStatus) ?? "All"
  )
    ? ((input?.status as "All" | TrackerIssueStatus) ?? "All")
    : "All";
  const selectedType = TYPE_OPTIONS.includes(
    (input?.type as "All" | TrackerIssueType) ?? "All"
  )
    ? ((input?.type as "All" | TrackerIssueType) ?? "All")
    : "All";
  const selectedDateRange = DATE_RANGE_OPTIONS.some(
    (option) => option.value === input?.dateRange
  )
    ? (input?.dateRange as TrackerDateRange)
    : "30d";
  const siteSelected = true;

  const filteredIssues = trackerIssues.filter((issue) => {
    const matchesSite = issue.site === selectedSite;
    const matchesSearch =
      normalizedSearch === "" ||
      issue.issue.toLowerCase().includes(normalizedSearch.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" || issue.status === selectedStatus;
    const matchesType = selectedType === "All" || issue.type === selectedType;
    const matchesRange = matchesDateRange(issue, selectedDateRange);

    return (
      matchesSite &&
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesRange
    );
  });

  const selectedIssue = filteredIssues.find((issue) => issue.id === input?.issueId);
  const inspectionMatrix = getInspectionMatrix(selectedSite);

  return {
    title: "Live Tracker",
    description: "Open inspection issues extracted from reports.",
    controls: {
      sites,
      selectedSite,
      search: normalizedSearch,
      exportFileName: "live-tracker-export.csv",
    },
    summary: {
      open: filteredIssues.filter((issue) => issue.status === "Open").length,
      readyForInspection: filteredIssues.filter((issue) => issue.status === "Ready")
        .length,
      closedLast7Days: filteredIssues.filter(wasClosedWithinLastSevenDays).length,
    },
    inspectionStatusTracker: {
      siteLabel: inspectionMatrix.siteLabel,
      overview: "Overview of inspection progress across all lots",
      lots: inspectionMatrix.lots,
      rows: inspectionMatrix.rows.map((row) => ({
        inspectionType: row.inspectionType,
        cells: row.statuses.map((status, index) => ({
          lot: inspectionMatrix.lots[index],
          status,
        })),
      })),
      progress: buildLotProgress(inspectionMatrix),
    },
    filters: {
      statuses: STATUS_OPTIONS,
      types: TYPE_OPTIONS,
      dateRanges: DATE_RANGE_OPTIONS,
      selectedStatus,
      selectedType,
      selectedDateRange,
    },
    issueRegister: {
      siteSelected,
      columns: ["Issue", "Type", "Date Identified", "Days Open", "Status"],
      items: filteredIssues.map((issue) => toIssueRow(issue, siteSelected)),
    },
    selectedIssue: selectedIssue ? toIssueDetail(selectedIssue) : null,
  };
}
