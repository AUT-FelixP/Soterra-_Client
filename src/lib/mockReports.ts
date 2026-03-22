import { addIssue } from "@/lib/mockIssues";

export type ReportIssue = {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
};

export type ReportRecord = {
  id: string;
  project: string;
  site: string;
  createdAt: string;
  status: "Reviewing" | "Completed" | "In progress";
  inspector: string;
  trade: string;
  issues: ReportIssue[];
};

const reports: ReportRecord[] = [
  {
    id: "rpt-1042",
    project: "Harbor View Tower",
    site: "Bayfront Site A",
    createdAt: "2026-02-03",
    status: "Reviewing",
    inspector: "Alex Morgan",
    trade: "Facade",
    issues: [
      {
        id: "issue-1042-1",
        title: "Sealant gaps around balcony edge",
        severity: "High",
      },
      {
        id: "issue-1042-2",
        title: "Waterproofing membrane overlap missing",
        severity: "Critical",
      },
    ],
  },
  {
    id: "rpt-1037",
    project: "North Ridge Schools",
    site: "Campus Block 2",
    createdAt: "2026-02-02",
    status: "Completed",
    inspector: "Jamie Park",
    trade: "Electrical",
    issues: [
      {
        id: "issue-1037-1",
        title: "Cable tray clearance below spec",
        severity: "High",
      },
      {
        id: "issue-1037-2",
        title: "Panel labeling incomplete",
        severity: "Medium",
      },
    ],
  },
  {
    id: "rpt-1031",
    project: "Union Rail Depot",
    site: "Platform Expansion",
    createdAt: "2026-02-01",
    status: "In progress",
    inspector: "Taylor Ng",
    trade: "Structural",
    issues: [
      {
        id: "issue-1031-1",
        title: "Rebar spacing variance in pier 4",
        severity: "High",
      },
    ],
  },
  {
    id: "rpt-1024",
    project: "Kauri Hospital Wing",
    site: "Level 5 Fit-out",
    createdAt: "2026-01-31",
    status: "Completed",
    inspector: "Morgan Lee",
    trade: "Fire safety",
    issues: [
      {
        id: "issue-1024-1",
        title: "Fire-stopping gaps at service riser",
        severity: "Critical",
      },
    ],
  },
  {
    id: "rpt-1018",
    project: "Downtown Mixed Use",
    site: "Tower B Podium",
    createdAt: "2026-01-30",
    status: "Reviewing",
    inspector: "Chris Patel",
    trade: "Mechanical",
    issues: [
      {
        id: "issue-1018-1",
        title: "Duct insulation missing in plant room",
        severity: "High",
      },
      {
        id: "issue-1018-2",
        title: "Access panels not sealed",
        severity: "Medium",
      },
    ],
  },
  {
    id: "rpt-1011",
    project: "Westlake Logistics",
    site: "Warehouse 3",
    createdAt: "2026-01-29",
    status: "Completed",
    inspector: "Riley Brooks",
    trade: "Concrete",
    issues: [
      {
        id: "issue-1011-1",
        title: "Slab curing variance in grid C6",
        severity: "Medium",
      },
    ],
  },
];

export function getReports() {
  return [...reports];
}

export function getReportById(id: string) {
  return reports.find((report) => report.id === id) ?? null;
}

export function addReport(payload: {
  project: string;
  site: string;
  status: ReportRecord["status"];
  inspector?: string;
  trade?: string;
  createdAt?: string;
}) {
  const createdAt = payload.createdAt ?? new Date().toISOString().slice(0, 10);
  const reportIssueId = `issue-${Date.now()}-1`;
  const newReport: ReportRecord = {
    id: `rpt-${Math.floor(1000 + Math.random() * 9000)}`,
    project: payload.project,
    site: payload.site,
    createdAt,
    status: payload.status,
    inspector: payload.inspector ?? "Soterra Bot",
    trade: payload.trade ?? "General",
    issues: [
      {
        id: reportIssueId,
        title: "AI extraction pending review",
        severity: "Medium",
      },
    ],
  };

  reports.unshift(newReport);

  for (const issue of newReport.issues) {
    addIssue({
      id: issue.id,
      description: issue.title,
      site: newReport.site,
      dateIdentified: newReport.createdAt,
      status: "Open",
      reinspections: 0,
    });
  }

  return newReport;
}
