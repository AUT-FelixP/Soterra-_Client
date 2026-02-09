import { getReports, type ReportRecord } from "@/lib/mockReports";

export type SiteStatus = "On Track" | "Needs Attention" | "Delayed";

export type SiteRecord = {
  id: string;
  project: string;
  siteName: string;
  status: SiteStatus;
  manager: string;
  region: string;
  phase: string;
  openRisks: number;
  highRiskCount: number;
  lastReportDate: string;
  description: string;
  initials: string;
  accent: string;
};

const sites: SiteRecord[] = [
  {
    id: "site-bayfront-a",
    project: "Harbor View Tower",
    siteName: "Bayfront Site A",
    status: "Needs Attention",
    manager: "Alex Morgan",
    region: "Auckland CBD",
    phase: "Facade and envelope",
    openRisks: 7,
    highRiskCount: 3,
    lastReportDate: "2026-02-03",
    description:
      "High-rise waterfront development with active facade works and waterproofing inspections.",
    initials: "HV",
    accent: "bg-pink-600 dark:bg-pink-700",
  },
  {
    id: "site-campus-block-2",
    project: "North Ridge Schools",
    siteName: "Campus Block 2",
    status: "On Track",
    manager: "Jamie Park",
    region: "North Shore",
    phase: "Services rough-in",
    openRisks: 4,
    highRiskCount: 1,
    lastReportDate: "2026-02-02",
    description:
      "Education block extension focused on MEP installations and commissioning readiness.",
    initials: "NR",
    accent: "bg-purple-600 dark:bg-purple-700",
  },
  {
    id: "site-platform-expansion",
    project: "Union Rail Depot",
    siteName: "Platform Expansion",
    status: "Delayed",
    manager: "Taylor Ng",
    region: "South Auckland",
    phase: "Structural package",
    openRisks: 6,
    highRiskCount: 2,
    lastReportDate: "2026-02-01",
    description:
      "Rail infrastructure expansion with constrained access windows and staged pours.",
    initials: "UR",
    accent: "bg-yellow-500 dark:bg-yellow-600",
  },
  {
    id: "site-level-5-fitout",
    project: "Kauri Hospital Wing",
    siteName: "Level 5 Fit-out",
    status: "Needs Attention",
    manager: "Morgan Lee",
    region: "Hamilton",
    phase: "Clinical fit-out",
    openRisks: 5,
    highRiskCount: 2,
    lastReportDate: "2026-01-31",
    description:
      "Hospital fit-out package with strict fire and compliance checks before handover.",
    initials: "KH",
    accent: "bg-green-500 dark:bg-green-600",
  },
  {
    id: "site-tower-b-podium",
    project: "Downtown Mixed Use",
    siteName: "Tower B Podium",
    status: "On Track",
    manager: "Chris Patel",
    region: "Wellington",
    phase: "Mechanical and finishing",
    openRisks: 3,
    highRiskCount: 1,
    lastReportDate: "2026-01-30",
    description:
      "Mixed-use podium with staged MEP closeout and tenancy readiness checks.",
    initials: "DM",
    accent: "bg-blue-600 dark:bg-blue-700",
  },
  {
    id: "site-warehouse-3",
    project: "Westlake Logistics",
    siteName: "Warehouse 3",
    status: "On Track",
    manager: "Riley Brooks",
    region: "Tauranga",
    phase: "Concrete and externals",
    openRisks: 2,
    highRiskCount: 0,
    lastReportDate: "2026-01-29",
    description:
      "Logistics facility with curing quality checks and high-volume floor load requirements.",
    initials: "WL",
    accent: "bg-indigo-600 dark:bg-indigo-700",
  },
];

function compareByDateDesc(a: { createdAt: string }, b: { createdAt: string }) {
  if (a.createdAt > b.createdAt) return -1;
  if (a.createdAt < b.createdAt) return 1;
  return 0;
}

export function getSites() {
  return [...sites].sort((a, b) => {
    if (a.lastReportDate > b.lastReportDate) return -1;
    if (a.lastReportDate < b.lastReportDate) return 1;
    return 0;
  });
}

export function getSiteById(id: string) {
  return sites.find((site) => site.id === id) ?? null;
}

export function getSiteReports(id: string): ReportRecord[] {
  const site = getSiteById(id);
  if (!site) return [];

  return getReports()
    .filter((report) => report.site === site.siteName)
    .sort(compareByDateDesc);
}
