"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

type InspectionRiskRow = {
  id: string;
  type: string;
  site: string;
  expectedDate: string;
  daysAway: number;
  riskLevel: "High" | "Medium" | "Low";
  actionLabel: string;
};

type LikelyFailureItem = {
  issue: string;
  historicalFailCount: number;
  failureShare: number;
};

type InspectionRiskData = {
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

export default function InspectionRiskPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InspectionRiskData | null>(null);
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [selectedDateRange, setSelectedDateRange] = useState("30d");
  const [selectedInspectionType, setSelectedInspectionType] =
    useState("Hydraulic");
  const [inspectionTypeQuery, setInspectionTypeQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInspectionRisk() {
      setLoading(true);

      try {
        const searchParams = new URLSearchParams({
          site: selectedSite,
          dateRange: selectedDateRange,
          inspectionType: selectedInspectionType,
        });
        const response = await fetch(`/api/inspection-risk?${searchParams.toString()}`);
        const nextData = await response.json();

        if (!isMounted) {
          return;
        }

        setData(nextData);
        setSelectedInspectionType(nextData?.filters?.selectedInspectionType ?? "Hydraulic");
      } catch {
        if (!isMounted) {
          return;
        }

        setData(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInspectionRisk();

    return () => {
      isMounted = false;
    };
  }, [selectedSite, selectedDateRange, selectedInspectionType]);

  const filteredInspectionTypes = useMemo(() => {
    if (!data?.filters.inspectionTypes?.length) {
      return [];
    }

    return inspectionTypeQuery === ""
      ? data.filters.inspectionTypes
      : data.filters.inspectionTypes.filter((type) =>
          type.toLowerCase().includes(inspectionTypeQuery.toLowerCase())
        );
  }, [data?.filters.inspectionTypes, inspectionTypeQuery]);

  function exportInspectionInsights(row: InspectionRiskRow) {
    const payload = {
      inspectionId: row.id,
      inspectionType: row.type,
      site: row.site,
      expectedDate: row.expectedDate,
      daysAway: row.daysAway,
      riskLevel: row.riskLevel,
      likelyFailureItems: data?.likelyFailureItems ?? [],
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.type.toLowerCase().replace(/\s+/g, "-")}-inspection-risk.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-gray-800 px-6 py-8 shadow-sm dark:bg-gray-800/70">
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Upcoming Inspection Risk
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-gray-300">
          Based on upcoming work and past inspection results.
        </p>
      </div>

      <section className="rounded-2xl bg-[#1f2937] px-6 py-6 shadow-sm ring-1 ring-white/10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr]">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Site</label>
            <div className="relative">
              <select
                value={selectedSite}
                onChange={(event) => setSelectedSite(event.target.value)}
                className="block w-full appearance-none rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30"
              >
                {(data?.filters.sites ?? ["All Sites"]).map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Date Range</label>
            <div className="relative">
              <select
                value={selectedDateRange}
                onChange={(event) => setSelectedDateRange(event.target.value)}
                className="block w-full appearance-none rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none transition focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30"
              >
                {(data?.filters.dateRanges ?? []).map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Combobox
              value={selectedInspectionType}
              onChange={(value) => {
                if (value) {
                  setInspectionTypeQuery("");
                  setSelectedInspectionType(value);
                }
              }}
            >
              <Label className="block text-sm font-medium text-white">
                Selected Inspection Type
              </Label>
              <div className="relative mt-2">
                <ComboboxInput
                  className="block w-full rounded-xl border border-white/10 bg-[#111827] py-3 pr-11 pl-4 text-sm text-white outline-none transition placeholder:text-gray-400 focus:border-[#6D5EF5] focus:ring-2 focus:ring-[#6D5EF5]/30"
                  onChange={(event) => setInspectionTypeQuery(event.target.value)}
                  onBlur={() => setInspectionTypeQuery("")}
                  displayValue={(value: string) => value}
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 focus:outline-hidden">
                  <ChevronDownIcon className="size-5 text-gray-400" aria-hidden="true" />
                </ComboboxButton>
                <ComboboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-[#111827] py-2 shadow-lg outline-none">
                  {filteredInspectionTypes.map((inspectionType) => (
                    <ComboboxOption
                      key={inspectionType}
                      value={inspectionType}
                      className="cursor-default px-4 py-2 text-sm text-gray-200 select-none data-focus:bg-[#6D5EF5] data-focus:text-white"
                    >
                      {inspectionType}
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              </div>
            </Combobox>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#1f2937] px-6 py-6 shadow-sm ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
              Upcoming Inspections
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Upcoming Inspections for This Site
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#111827]">
                <tr className="text-left text-xs font-semibold tracking-[0.18em] text-gray-400 uppercase">
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Expected Date</th>
                  <th className="px-5 py-4">Days Away</th>
                  <th className="px-5 py-4">Risk Level</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#1f2937]">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <tr key={`inspection-row-skeleton-${index}`}>
                        {Array.from({ length: 5 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-5 py-4">
                            <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-white/10" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : data?.upcomingInspections.map((row) => (
                      <tr key={row.id} className="text-sm text-gray-200">
                        <td className="px-5 py-4 font-medium text-white">{row.type}</td>
                        <td className="px-5 py-4">{formatDate(row.expectedDate)}</td>
                        <td className="px-5 py-4">{row.daysAway}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              row.riskLevel === "High"
                                ? "bg-rose-500/15 text-rose-200 ring-1 ring-rose-300/20"
                                : row.riskLevel === "Medium"
                                  ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-300/20"
                                  : "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/20"
                            }`}
                          >
                            {row.riskLevel}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => exportInspectionInsights(row)}
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#6D5EF5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5f51e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]"
                          >
                            <ArrowDownTrayIcon className="size-4" aria-hidden="true" />
                            {row.actionLabel}
                          </button>
                        </td>
                      </tr>
                    ))}
                {!loading && !data?.upcomingInspections.length ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-gray-400"
                    >
                      No inspections found for the selected filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#1f2937] px-6 py-6 shadow-sm ring-1 ring-white/10">
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
            Likely Failure Items
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Likely Failure Items ({selectedInspectionType})
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#111827]">
                <tr className="text-left text-xs font-semibold tracking-[0.18em] text-gray-400 uppercase">
                  <th className="px-5 py-4">Issue</th>
                  <th className="px-5 py-4">Historical Fail Count</th>
                  <th className="px-5 py-4">% of Failures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#1f2937]">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <tr key={`failure-row-skeleton-${index}`}>
                        {Array.from({ length: 3 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-5 py-4">
                            <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-white/10" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : data?.likelyFailureItems.map((item) => (
                      <tr key={item.issue} className="text-sm text-gray-200">
                        <td className="px-5 py-4 font-medium text-white">{item.issue}</td>
                        <td className="px-5 py-4">{item.historicalFailCount}</td>
                        <td className="px-5 py-4">{item.failureShare}%</td>
                      </tr>
                    ))}
                {!loading && !data?.likelyFailureItems.length ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-sm text-gray-400"
                    >
                      No likely failure items are available for this inspection type.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
