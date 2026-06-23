"use client";

import { InsightsChartGrid, ProjectComparisonPanel } from "./insights-charts";
import { InsightsFilterBar, KpiStrip } from "./insights-controls";
import { DataQuality, IssuePriorityTable } from "./insights-tables";
import { useInsightsDashboard } from "./use-insights-dashboard";

export default function InsightsPage() {
  const { data, error, filters, issueFilterOptions, loading, reportNames, resetFilters, updateFilter } = useInsightsDashboard();

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) return <MessageState title="We couldn't load insights" body={error} action={resetFilters} />;
  if (!data?.hasReports) return <MessageState title="No inspection data yet" body="Upload inspection reports to generate insights." />;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10 text-slate-950 dark:text-white">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Field-ready risk, fixes, and data quality from uploaded inspection reports.</p>
        </div>
        {loading ? <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200">Updating dashboard...</span> : null}
      </header>

      <InsightsFilterBar filters={filters} options={data.filters} issues={issueFilterOptions} reportNames={reportNames} onChange={updateFilter} onReset={resetFilters} />
      {error ? <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error} Showing the last valid response.</div> : null}

      {data.issueDrilldown.length === 0 ? (
        <MessageState title="No matching findings" body="No findings match the selected filters." action={resetFilters} />
      ) : (
        <>
          <KpiStrip kpis={data.kpis} />
          <IssuePriorityTable issues={data.issueDrilldown} risks={data.riskMatrix} reportNames={reportNames} />
          <InsightsChartGrid insights={data} />
          <ProjectComparisonPanel insights={data} />
          <DataQuality quality={data.dataQuality} />
        </>
      )}
    </div>
  );
}

function MessageState({ title, body, action }: { title: string; body: string; action?: () => void }) {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{body}</p>
        {action ? <button onClick={action} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">Reset filters</button> : null}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-56 rounded-xl bg-slate-200 dark:bg-white/10" />
      <div className="h-24 rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.035]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-24 rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.035]" />)}</div>
      <div className="grid gap-3 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-72 rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.035]" />)}</div>
    </div>
  );
}
