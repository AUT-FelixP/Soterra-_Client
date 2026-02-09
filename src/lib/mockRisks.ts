export type RiskTimelineEvent = {
  id: string;
  type: "created" | "status" | "owner" | "note";
  content: string;
  target?: string;
  date: string;
  datetime: string;
};

export type RiskRecord = {
  id: string;
  title: string;
  site: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Investigating" | "Resolved";
  owner?: string;
  createdAt: string;
  description: string;
  timeline: RiskTimelineEvent[];
};

const risks: RiskRecord[] = [
  {
    id: "risk-301",
    title: "Repeat waterproofing failures",
    site: "Bayfront Site A",
    severity: "Critical",
    status: "Open",
    owner: "Alex Morgan",
    createdAt: "2026-02-03",
    description:
      "Multiple balcony edges showing sealant voids and membrane overlap gaps.",
    timeline: [
      {
        id: "event-301-1",
        type: "created",
        content: "Risk flagged from AI scan",
        date: "Feb 3, 2026",
        datetime: "2026-02-03",
      },
      {
        id: "event-301-2",
        type: "owner",
        content: "Assigned to",
        target: "Alex Morgan",
        date: "Feb 3, 2026",
        datetime: "2026-02-03",
      },
    ],
  },
  {
    id: "risk-295",
    title: "Fire-stopping gaps flagged",
    site: "Campus Block 2",
    severity: "High",
    status: "Investigating",
    owner: "Jamie Park",
    createdAt: "2026-02-02",
    description:
      "Service riser penetrations missing fire-stopping sealant on level 4.",
    timeline: [
      {
        id: "event-295-1",
        type: "created",
        content: "Risk flagged from inspection",
        date: "Feb 2, 2026",
        datetime: "2026-02-02",
      },
      {
        id: "event-295-2",
        type: "status",
        content: "Investigation started by",
        target: "Jamie Park",
        date: "Feb 2, 2026",
        datetime: "2026-02-02",
      },
    ],
  },
  {
    id: "risk-288",
    title: "Electrical clearance non-compliance",
    site: "Tower B Podium",
    severity: "High",
    status: "Open",
    owner: "Chris Patel",
    createdAt: "2026-02-01",
    description:
      "Switchboard clearance below regulatory threshold in plant room.",
    timeline: [
      {
        id: "event-288-1",
        type: "created",
        content: "Risk flagged from inspection",
        date: "Feb 1, 2026",
        datetime: "2026-02-01",
      },
    ],
  },
  {
    id: "risk-274",
    title: "Concrete curing variance",
    site: "Warehouse 3",
    severity: "Medium",
    status: "Investigating",
    owner: "Riley Brooks",
    createdAt: "2026-01-30",
    description:
      "Temperature logs show inconsistent curing profile across grid C6.",
    timeline: [
      {
        id: "event-274-1",
        type: "created",
        content: "Issue detected in curing logs",
        date: "Jan 30, 2026",
        datetime: "2026-01-30",
      },
    ],
  },
  {
    id: "risk-269",
    title: "Guardrail anchoring gaps",
    site: "Level 5 Fit-out",
    severity: "Critical",
    status: "Open",
    owner: "Morgan Lee",
    createdAt: "2026-01-29",
    description:
      "Temporary guardrails missing anchor bolts along north perimeter.",
    timeline: [
      {
        id: "event-269-1",
        type: "created",
        content: "Safety audit flagged missing anchors",
        date: "Jan 29, 2026",
        datetime: "2026-01-29",
      },
    ],
  },
  {
    id: "risk-250",
    title: "Material delivery delays",
    site: "North Ridge Schools",
    severity: "Low",
    status: "Resolved",
    owner: "Taylor Ng",
    createdAt: "2026-01-24",
    description: "Supplier delays impacting mechanical rough-in schedule.",
    timeline: [
      {
        id: "event-250-1",
        type: "created",
        content: "Delay logged",
        date: "Jan 24, 2026",
        datetime: "2026-01-24",
      },
      {
        id: "event-250-2",
        type: "status",
        content: "Resolved by",
        target: "Taylor Ng",
        date: "Jan 27, 2026",
        datetime: "2026-01-27",
      },
    ],
  },
];

export function getRisks() {
  return [...risks];
}

export function getRiskById(id: string) {
  return risks.find((risk) => risk.id === id) ?? null;
}

function createTimelineDate(date: Date) {
  const datetime = date.toISOString().slice(0, 10);
  const display = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return { datetime, display };
}

export function updateRisk(
  id: string,
  updates: { status?: RiskRecord["status"]; owner?: string }
) {
  const index = risks.findIndex((risk) => risk.id === id);
  if (index === -1) return null;
  const existing = risks[index];
  const next: RiskRecord = { ...existing };

  const now = createTimelineDate(new Date());

  if (typeof updates.status === "string" && updates.status !== existing.status) {
    next.status = updates.status;
    next.timeline = [
      ...next.timeline,
      {
        id: `event-${id}-${Date.now()}-status`,
        type: "status",
        content:
          updates.status === "Resolved"
            ? "Marked resolved by"
            : updates.status === "Investigating"
              ? "Marked investigating by"
              : "Re-opened by",
        target: next.owner ?? "System",
        date: now.display,
        datetime: now.datetime,
      },
    ];
  }

  if (typeof updates.owner === "string" && updates.owner !== existing.owner) {
    next.owner = updates.owner;
    next.timeline = [
      ...next.timeline,
      {
        id: `event-${id}-${Date.now()}-owner`,
        type: "owner",
        content: "Assigned owner",
        target: updates.owner,
        date: now.display,
        datetime: now.datetime,
      },
    ];
  }

  risks[index] = next;
  return next;
}
