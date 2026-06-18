"use client";

import { useEffect, useState } from "react";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import { DEFAULT_INSIGHT_FILTERS, type InsightFilters } from "./insights-types";

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
  const [data, setData] = useState<DashboardInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/dashboard/insights?${new URLSearchParams(filters)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Insights could not be loaded.");
        return response.json() as Promise<DashboardInsightsResponse>;
      })
      .then((payload) => {
        assertValidPayload(payload);
        setData(payload);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message || "Insights could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  return {
    data,
    error,
    filters,
    loading,
    resetFilters: () => setFilters(DEFAULT_INSIGHT_FILTERS),
    updateFilter: (key: keyof InsightFilters, value: string) =>
      setFilters((current) => ({ ...current, [key]: value })),
  };
}
