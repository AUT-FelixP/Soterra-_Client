"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import { filterInsightsByIssueLocation } from "./filter-insights-by-location";
import { DEFAULT_INSIGHT_FILTERS, type InsightFilters } from "./insights-types";

const DASHBOARD_FILTER_KEYS: Array<keyof InsightFilters> = [
  "project", "site", "inspection_type", "trade", "severity", "status", "date_range",
];

function assertValidPayload(payload: DashboardInsightsResponse) {
  const issueCount = payload.issueDrilldown.length;
  const issueKpi = payload.kpis.find((item) => item.key === "issues")?.value;
  const severityTotal = payload.visuals.severityDonut.reduce((sum, item) => sum + item.value, 0);
  const statusTotal = payload.visuals.statusDonut.reduce((sum, item) => sum + item.value, 0);

  if (issueKpi !== issueCount || severityTotal !== issueCount || statusTotal !== issueCount) {
    throw new Error("The insights response is internally inconsistent. Please refresh or contact support.");
  }
}

export function useInsightsDashboard() {
  const [filters, setFilters] = useState<InsightFilters>(DEFAULT_INSIGHT_FILTERS);
  const [baseData, setBaseData] = useState<DashboardInsightsResponse | null>(null);
  const [reportNames, setReportNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dashboardQuery = DASHBOARD_FILTER_KEYS.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(filters[key])}`).join("&");
  const data = useMemo(
    () => baseData ? filterInsightsByIssueLocation(baseData, filters) : null,
    [baseData, filters]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/dashboard/insights?${dashboardQuery}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Insights could not be loaded.");
        return response.json() as Promise<DashboardInsightsResponse>;
      })
      .then((payload) => {
        assertValidPayload(payload);
        setBaseData(payload);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message || "Insights could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [dashboardQuery]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reports", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Reports could not be loaded.")))
      .then((payload: unknown) => {
        const items = Array.isArray(payload) ? payload : payload && typeof payload === "object" && "items" in payload && Array.isArray(payload.items) ? payload.items : [];
        setReportNames(Object.fromEntries(items.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const id = "id" in item && typeof item.id === "string" ? item.id : "";
          const sourceFileName = "sourceFileName" in item && typeof item.sourceFileName === "string" ? item.sourceFileName.trim() : "";
          return id ? [[id, sourceFileName || id]] : [];
        })));
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setReportNames({});
      });
    return () => controller.abort();
  }, []);

  return {
    data,
    error,
    filters,
    issueFilterOptions: baseData?.issueDrilldown ?? [],
    loading,
    reportNames,
    resetFilters: () => {
      setLoading(DASHBOARD_FILTER_KEYS.some((key) => filters[key] !== DEFAULT_INSIGHT_FILTERS[key]));
      setError(null);
      setFilters(DEFAULT_INSIGHT_FILTERS);
    },
    updateFilter: (key: keyof InsightFilters, value: string) => {
      if (DASHBOARD_FILTER_KEYS.includes(key)) setLoading(true);
      setError(null);
      setFilters((current) => {
        const next = { ...current, [key]: value };

        if (key === "project" || key === "site") {
          next.report_id = DEFAULT_INSIGHT_FILTERS.report_id;
          next.location = DEFAULT_INSIGHT_FILTERS.location;
        } else if (key === "report_id") {
          next.location = DEFAULT_INSIGHT_FILTERS.location;
        }

        return next;
      });
    },
  };
}
