"use client";

import type { ReactElement } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardInsightsResponse } from "@/lib/dashboardAppData";
import type { ChartDatum } from "./insights-types";

const BLUE = "#6366f1";
const BLUE_SHADES = ["#6366f1", "#38bdf8", "#22c55e", "#f59e0b", "#fb7185"];
const AXIS = "#8b949e";
const GRID = "rgba(139, 148, 158, 0.16)";
const CHART_FONT_SIZE = 12;
const RESPONSIVE_PROPS = { minWidth: 0, initialDimension: { width: 1, height: 1 } } as const;
type ChartConfig = { key: string; title: string; content: ReactElement };

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: ChartDatum & { fullName?: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d0f12] px-3 py-2 text-sm leading-5 shadow-2xl">
      <p className="max-w-64 text-slate-400">{row.payload?.fullName || label || row.payload?.name}</p>
      <p className="mt-1 font-semibold text-white">{Number(row.value || 0).toLocaleString()} findings</p>
    </div>
  );
}

export function ChartPanel({ title, total, className, children }: {
  title: string;
  total: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`min-h-72 min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none ${className || ""}`}>
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
        <div>
          <h2 className="text-base font-semibold leading-6 tracking-tight">{title}</h2>
          <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{total.toLocaleString()}</p>
        </div>
      </header>
      <div className="h-56 min-w-0 px-2 pb-3 pt-2">{children}</div>
    </article>
  );
}

export function DistributionChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  return (
    <div className="flex h-full min-w-0 items-center gap-3">
      <div className="relative h-full min-w-0 flex-1">
        <ResponsiveContainer {...RESPONSIVE_PROPS}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="82%" stroke="#111316" strokeWidth={2}>
              {data.map((row, index) => <Cell key={row.name} fill={BLUE_SHADES[index % BLUE_SHADES.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><strong className="text-2xl tabular-nums">{total}</strong><span className="block text-xs leading-4 text-slate-500">total</span></div>
        </div>
      </div>
      <ul className="w-36 space-y-2 text-sm leading-5">
        {data.map((row, index) => (
          <li key={row.name} className="flex items-center justify-between gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400"><i className="mr-1.5 inline-block size-2 rounded-sm" style={{ background: BLUE_SHADES[index % BLUE_SHADES.length] }} />{row.name}</span>
            <strong className="tabular-nums">{row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBars({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer {...RESPONSIVE_PROPS}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" width={104} tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(47,125,244,0.06)" }} />
        <Bar dataKey="value" fill={BLUE} radius={[0, 2, 2, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function compactLabel(value: string, maxLength = 21) {
  const singleLine = value.replace(/\s+/g, " ").trim();
  return singleLine.length > maxLength ? `${singleLine.slice(0, maxLength - 1)}…` : singleLine;
}

function prepareLocationData(data: ChartDatum[]) {
  const clean = data
    .filter((item) => item.value > 0)
    .map((item) => ({ ...item, name: item.name.replace(/\s+/g, " ").trim(), fullName: item.name.replace(/\s+/g, " ").trim() }));
  const visible = clean.slice(0, 6);
  const remaining = clean.slice(6);
  if (!remaining.length) return visible;
  return [
    ...visible,
    {
      name: `Other locations (${remaining.length})`,
      fullName: `${remaining.length} additional locations`,
      value: remaining.reduce((sum, item) => sum + item.value, 0),
    },
  ];
}

export function LocationBars({ data }: { data: ChartDatum[] }) {
  const locations = prepareLocationData(data);
  return (
    <ResponsiveContainer {...RESPONSIVE_PROPS}>
      <BarChart data={locations} layout="vertical" margin={{ left: 12, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="name"
          type="category"
          width={132}
          interval={0}
          tickFormatter={(value) => compactLabel(String(value))}
          tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(47,125,244,0.06)" }} />
        <Bar dataKey="value" fill={BLUE} radius={[0, 2, 2, 0]} maxBarSize={17} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IssuesTrend({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer {...RESPONSIVE_PROPS}>
      <AreaChart data={data} margin={{ left: -20, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="insights-blue-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.42} />
            <stop offset="75%" stopColor={BLUE} stopOpacity={0.06} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(91,156,255,.55)", strokeDasharray: "3 3" }} />
        <Area dataKey="value" type="monotone" stroke={BLUE} strokeWidth={2} fill="url(#insights-blue-area)" dot={false} activeDot={{ r: 4, fill: BLUE, stroke: "#fff", strokeWidth: 1 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProjectBars({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer {...RESPONSIVE_PROPS}>
      <BarChart data={data} margin={{ left: -20, right: 12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }} axisLine={false} tickLine={false} interval={0} />
        <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: CHART_FONT_SIZE }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(47,125,244,0.06)" }} />
        <Bar dataKey="value" fill={BLUE} radius={[2, 2, 0, 0]} maxBarSize={68} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InsightsChartGrid({ insights }: { insights: DashboardInsightsResponse }) {
  const total = insights.issueDrilldown.length;
  const charts = [
    insights.visuals.severityDonut.length > 1
      ? { key: "severity", title: "Issues by severity", content: <DistributionChart data={insights.visuals.severityDonut} /> }
      : null,
    insights.visuals.statusDonut.length > 1
      ? { key: "status", title: "Issues by status", content: <DistributionChart data={insights.visuals.statusDonut} /> }
      : null,
    insights.visuals.tradeBar.length > 0
      ? { key: "trade", title: "Issues by trade", content: <HorizontalBars data={insights.visuals.tradeBar} /> }
      : null,
    insights.visuals.categoryBar.length > 0
      ? { key: "category", title: "Issues by category", content: <HorizontalBars data={insights.visuals.categoryBar} /> }
      : null,
    insights.visuals.locationBar.length > 0
      ? { key: "location", title: "Issues by location", content: <LocationBars data={insights.visuals.locationBar} /> }
      : null,
    insights.visuals.issuesOverTime.length > 1
      ? { key: "time", title: "Issues over time", content: <IssuesTrend data={insights.visuals.issuesOverTime} /> }
      : null,
  ].filter((chart): chart is ChartConfig => Boolean(chart));

  if (!charts.length) return null;

  return (
    <section className="grid gap-3 xl:grid-cols-12" aria-label="Inspection charts">
      {charts.map((chart) => (
        <ChartPanel key={chart.key} title={chart.title} total={total} className="xl:col-span-4">{chart.content}</ChartPanel>
      ))}
    </section>
  );
}

export function ProjectComparisonPanel({ insights }: { insights: DashboardInsightsResponse }) {
  if (insights.visuals.projectComparison.length <= 1) return null;

  return (
    <ChartPanel title="Project comparison" total={insights.issueDrilldown.length}>
      <ProjectBars data={insights.visuals.projectComparison} />
    </ChartPanel>
  );
}
