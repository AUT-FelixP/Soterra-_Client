import { NextResponse } from "next/server";
import { fetchBackendJson } from "@/lib/backendProxy";
import {
  selectSoterraMetricRoutes,
  soterraMetricRoutes,
  type SoterraMetricRoute,
} from "@/lib/soterraAiMetricRoutes";

type RouteResult = {
  route: SoterraMetricRoute;
  ok: boolean;
  summary: string;
  data?: unknown;
  error?: string;
};

export async function GET() {
  return NextResponse.json({
    routes: soterraMetricRoutes,
    mcpTools: soterraMetricRoutes.map((route) => ({
      name: `soterra.${route.id.replace(/-/g, "_")}`,
      description: route.description,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language metric question from the client.",
          },
        },
      },
      route: {
        frontendPath: route.frontendPath,
        backendPath: route.backendPath,
      },
    })),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const question =
    payload && typeof payload === "object" && "question" in payload
      ? String(payload.question ?? "")
      : "";
  const context =
    payload && typeof payload === "object" && "context" in payload
      ? String(payload.context ?? "")
      : "";
  const trimmedQuestion = question.trim();
  const trimmedContext = context.trim();

  if (!trimmedQuestion) {
    return NextResponse.json(
      { answer: "Ask a question about your inspection reports." },
      { status: 400 }
    );
  }

  const routeQuestion = trimmedContext && trimmedContext !== "All reports"
    ? `${trimmedContext}: ${trimmedQuestion}`
    : trimmedQuestion;
  const selectedRoutes = selectSoterraMetricRoutes(routeQuestion);
  const results = await Promise.all(
    selectedRoutes.map(async (route) => fetchMetricRoute(route))
  );

  return NextResponse.json({
    answer: buildMetricAnswer(trimmedQuestion, results, trimmedContext),
    routes: selectedRoutes.map((route) => ({
      id: route.id,
      name: route.name,
      frontendPath: route.frontendPath,
      backendPath: route.backendPath,
      description: route.description,
    })),
    results,
  });
}

async function fetchMetricRoute(route: SoterraMetricRoute): Promise<RouteResult> {
  try {
    const data = await fetchBackendJson<unknown>(route.backendPath);
    return {
      route,
      ok: true,
      data,
      summary: summarizeRouteData(route.id, data),
    };
  } catch (error) {
    return {
      route,
      ok: false,
      summary: "Some report details are still processing.",
      error: error instanceof Error ? error.message : "Metric route failed.",
    };
  }
}

function buildMetricAnswer(question: string, results: RouteResult[], context: string) {
  const available = results.filter((result) => result.ok);
  const unavailable = results.filter((result) => !result.ok);
  const details = available.map((result) => `- ${result.summary}`);
  const lines = [
    "Summary",
    available.length
      ? `I checked your ${context && context !== "All reports" ? context.toLowerCase() : "uploaded reports"} for: "${question}".`
      : `I found the right records to check for: "${question}", but they are not available yet.`,
    "",
    "Fix first",
    ...(details.length ? details : ["- Some report details are still processing. You can still review the defects found so far."]),
    "",
    "Missing evidence",
    "- Check for close-out photos, sign-offs, and repair notes linked to open defects.",
    "",
    "Next steps",
    "- Review the open defects first.",
    "- Upload missing photos, sign-offs, or repair notes before close-out.",
    "- Confirm the site is ready before booking reinspection.",
  ];

  if (unavailable.length) {
    lines.push("");
    lines.push(
      `Some report details are still processing: ${unavailable
        .map((result) => result.route.name)
        .join(", ")}. You can still review the defects found so far.`
    );
  }

  return lines.join("\n");
}

function summarizeRouteData(routeId: string, data: unknown) {
  const record = asRecord(data);

  if (routeId === "dashboard-overview") {
    const metrics = asArray(record.metrics)
      .map((item) => {
        const metric = asRecord(item);
        const label = readString(metric, "label");
        if (label.toLowerCase() === "issues / inspection") return "";
        return `${label}: ${readString(metric, "value")}`;
      })
      .filter(Boolean);
    const tracker = asRecord(record.liveTracker);
    const failures = asArray(record.topFailureDrivers)
      .slice(0, 3)
      .map((item) => readString(asRecord(item), "issue"))
      .filter(Boolean);

    return `Overall job status: ${metrics.join(", ") || "summary loaded"}; open issues ${readNumber(tracker, "openIssues") ?? "unknown"}; common failures ${failures.join(", ") || "loaded"}.`;
  }

  if (routeId === "company-performance") {
    const projects = asArray(record.projects);
    const inspectionTypes = asArray(record.inspectionTypes);
    return `Projects checked: ${projects.length} project${projects.length === 1 ? "" : "s"} and ${inspectionTypes.length} inspection type${inspectionTypes.length === 1 ? "" : "s"}.`;
  }

  if (routeId === "performance") {
    const failures = asArray(record.topFailureDrivers)
      .slice(0, 3)
      .map((item) => {
        const failure = asRecord(item);
        return `${readString(failure, "issue")} (${readNumber(failure, "failCount") ?? readString(failure, "failureShare")})`;
      })
      .filter(Boolean);
    return `Most common defects include ${failures.join(", ") || "the available failure items"}. ${readString(record, "recurrenceSummary")}`;
  }

  if (routeId === "risk") {
    const inspections = asArray(record.inspections);
    const failures = asArray(record.likelyFailures)
      .slice(0, 3)
      .map((item) => readString(asRecord(item), "issue"))
      .filter(Boolean);
    return `Upcoming inspection check: ${inspections.length} inspection${inspections.length === 1 ? "" : "s"} found; likely problem areas include ${failures.join(", ") || "available risk items"}.`;
  }

  if (routeId === "legacy-insights") {
    const rootCauses = asArray(record.rootCauses).slice(0, 3).map(String);
    const patterns = asArray(record.repeatedPatterns);
    return `Likely causes include ${rootCauses.join(", ") || "the loaded causes"}; ${patterns.length} repeat pattern${patterns.length === 1 ? "" : "s"} found.`;
  }

  if (routeId === "tracker") {
    const summary = asRecord(record.summary);
    const issueRegister = asRecord(record.issueRegister);
    const issues = asArray(issueRegister.items);
    return `Issue list: open ${readNumber(summary, "open") ?? "unknown"}, ready for inspection ${readNumber(summary, "readyForInspection") ?? "unknown"}, closed in the last 7 days ${readNumber(summary, "closedLast7Days") ?? "unknown"}; ${issues.length} item${issues.length === 1 ? "" : "s"} checked.`;
  }

  if (routeId === "reports") {
    const items = Array.isArray(data) ? data : asArray(record.items);
    const reviewing = items.filter((item) => readString(asRecord(item), "status") === "Reviewing").length;
    const completed = items.filter((item) => readString(asRecord(item), "status") === "Completed").length;
    return `Reports checked: ${items.length} uploaded report${items.length === 1 ? "" : "s"}; ${reviewing} still reviewing and ${completed} completed.`;
  }

  return `Records were checked successfully.`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : null;
}
