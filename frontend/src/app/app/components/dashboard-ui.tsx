"use client";

import Link from "next/link";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DashboardMetric = {
  label: string;
  value: string;
  tone?: "default" | "critical" | "warning" | "success";
};

export type TableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
};

export function DashboardPageIntro(props: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {props.eyebrow ? (
          <p className="text-xs/6 font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
            {props.eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2rem]">
          {props.title}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm/6 text-slate-600 dark:text-slate-300">
          {props.description}
        </p>
      </div>
      {props.action ? <div className="shrink-0">{props.action}</div> : null}
    </div>
  );
}

export function DashboardSection(props: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
      <div className="flex flex-col gap-2.5 border-b border-slate-200 pb-3.5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {props.title}
          </h2>
          {props.description ? (
            <p className="mt-1 text-sm/6 text-slate-600 dark:text-slate-400">
              {props.description}
            </p>
          ) : null}
        </div>
        {props.action ? <div className="shrink-0">{props.action}</div> : null}
      </div>
      <div className="mt-4">{props.children}</div>
    </section>
  );
}

export function DashboardMetricGrid({ items }: { items: DashboardMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none"
        >
          <p className="text-xs/6 font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {item.label}
          </p>
          <p className={metricValueTone(item.tone)}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardHighlight(props: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 dark:border-indigo-400/20 dark:bg-indigo-500/10 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs/6 font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-200">
          {props.label}
        </p>
        <div className="mt-1.5 text-sm/6 text-slate-700 dark:text-slate-200">{props.children}</div>
      </div>
      {props.action ? <div className="shrink-0">{props.action}</div> : null}
    </div>
  );
}

export function DashboardTwoColumn(props: { children: React.ReactNode }) {
  return <div className="grid gap-5 xl:grid-cols-2">{props.children}</div>;
}

export function DashboardSubCard(props: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/55">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {props.title}
      </h3>
      {props.description ? (
        <p className="mt-1 text-sm/6 text-slate-600 dark:text-slate-400">
          {props.description}
        </p>
      ) : null}
      <div className="mt-3.5">{props.children}</div>
    </div>
  );
}

export function DashboardDataTable<T>(props: {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  maxHeightClassName?: string;
  stickyHeader?: boolean;
  getRowKey?: (row: T, index: number) => string;
  rowClassName?: (row: T, index: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
      <div className={`overflow-auto ${props.maxHeightClassName ?? ""}`}>
        <table className="min-w-full table-fixed divide-y divide-slate-200 dark:divide-white/10">
          <thead className={`${props.stickyHeader ? "sticky top-0 z-10" : ""} bg-slate-50 dark:bg-slate-950/80`}>
            <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {props.columns.map((column) => (
                <th
                  key={column.key}
                  className={headerAlignment(column.align)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-slate-900/30">
            {props.rows.length ? props.rows.map((row, index) => (
              <tr
                key={props.getRowKey ? props.getRowKey(row, index) : index}
                className={`text-sm/6 text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5 ${props.rowClassName ? props.rowClassName(row, index) : ""}`}
              >
                {props.columns.map((column) => (
                  <td key={column.key} className={cellAlignment(column.align)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td
                  colSpan={props.columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  {props.emptyMessage ?? "No rows to show."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DashboardBarChart(props: {
  data: Array<{ label: string; value: number; formattedValue?: string }>;
  colorClassName?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const chartData = props.data.map((item) => ({
    ...item,
    value: Number.isFinite(item.value) ? item.value : 0,
    formattedValue: item.formattedValue ?? String(item.value),
  }));

  if (!chartData.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0b0b0d]/86 dark:shadow-none">
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No trend data available
        </div>
      </div>
    );
  }

  const latest = chartData.at(-1);
  const previous = chartData.at(-2);
  const delta =
    latest && previous ? latest.value - previous.value : null;
  const deltaLabel =
    delta === null
      ? "No previous period"
      : `${delta > 0 ? "+" : ""}${delta} vs previous`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0b0b0d]/86 dark:shadow-none">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Monthly issues
          </p>
          <p className="mt-1 text-[1.85rem] font-semibold tracking-tight text-slate-950 dark:text-white">
            {latest?.formattedValue ?? "0"}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
            delta !== null && delta <= 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200"
              : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300"
          }`}
        >
          {deltaLabel}
        </span>
      </div>

      <div className="h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 4, left: -18 }}
          >
            <defs>
              <linearGradient id={`${gradientId}-trend`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b7cf6" stopOpacity={0.42} />
                <stop offset="58%" stopColor="#8b7cf6" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#8b7cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(148, 163, 184, 0.22)"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              minTickGap={18}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={42}
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
            />
            <Tooltip
              cursor={{
                stroke: "#8b7cf6",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={<DashboardChartTooltip />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8b7cf6"
              strokeWidth={2.6}
              fill={`url(#${gradientId}-trend)`}
              dot={false}
              activeDot={{
                r: 4,
                fill: "#8b7cf6",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DashboardChartTooltip(props: {
  active?: boolean;
  label?: string;
  payload?: Array<{
    payload?: { formattedValue?: string; value?: number };
    value?: number;
  }>;
}) {
  if (!props.active || !props.payload?.length) {
    return null;
  }

  const point = props.payload[0];
  const value =
    point.payload?.formattedValue ?? point.value ?? point.payload?.value ?? 0;

  return (
    <div className="rounded-lg border border-white/10 bg-[#08080a]/95 px-3 py-2 shadow-xl shadow-black/25">
      <p className="text-xs font-semibold text-slate-400">{props.label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value} issues</p>
    </div>
  );
}

export function DashboardLineChart(props: {
  data: Array<{ label: string; value: number; formattedValue?: string }>;
}) {
  if (!props.data.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/55">
        <div className="flex h-36 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No trend data available
        </div>
      </div>
    );
  }

  const chartWidth = 100;
  const chartHeight = 56;
  const paddingX = 8;
  const paddingTop = 6;
  const paddingBottom = 8;
  const values = props.data.map((item) => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const stepX =
    props.data.length > 1 ? (chartWidth - paddingX * 2) / (props.data.length - 1) : 0;

  const points = props.data.map((item, index) => {
    const x = paddingX + stepX * index;
    const y =
      chartHeight -
      paddingBottom -
      ((item.value - minValue) / range) * (chartHeight - paddingTop - paddingBottom);

    return {
      ...item,
      x,
      y,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  const gridLines = [0, 1, 2, 3].map((line) => {
    const y = paddingTop + ((chartHeight - paddingTop - paddingBottom) / 3) * line;
    return { y };
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/55">
      <div className="grid gap-4">
        <div className="relative h-40 overflow-hidden rounded-xl border border-slate-200/80 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-950/70">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
            {gridLines.map((line) => (
              <line
                key={line.y}
                x1={paddingX}
                x2={chartWidth - paddingX}
                y1={line.y}
                y2={line.y}
                className="stroke-slate-200 dark:stroke-white/10"
                strokeWidth="0.6"
                strokeDasharray="2 3"
              />
            ))}
            <path d={areaPath} className="fill-indigo-200/60 dark:fill-indigo-500/10" />
            <path
              d={linePath}
              className="fill-none stroke-indigo-600 dark:stroke-indigo-300"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point) => (
              <g key={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="2.2"
                  className="fill-white stroke-indigo-600 dark:fill-slate-950 dark:stroke-indigo-300"
                  strokeWidth="1.6"
                />
              </g>
            ))}
          </svg>

          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
            {points.map((point) => (
              <div
                key={`${point.label}-value`}
                className="min-w-0 flex-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400"
              >
                {point.formattedValue ?? point.value}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 text-center" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
          {points.map((point) => (
            <div key={`${point.label}-axis`} className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {point.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardListBars(props: {
  items: Array<{ label: string; value: number; tone?: "critical" | "warning" | "success" }>;
  suffix?: string;
}) {
  return (
    <div className="space-y-4">
      {props.items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-slate-900 dark:text-white">{item.label}</span>
            <span className="text-slate-600 dark:text-slate-300">
              {item.value}
              {props.suffix ?? "%"}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className={`h-2.5 rounded-full ${barTone(item.tone)}`}
              style={{ width: `${Math.max(Math.min(item.value, 100), 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardBulletList(props: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {props.items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
          <span className="mt-1.5 size-2 rounded-full bg-indigo-500 dark:bg-indigo-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardBadge(props: {
  label: string;
  tone?: "critical" | "warning" | "success" | "neutral";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeTone(
        props.tone
      )}`}
    >
      {props.label}
    </span>
  );
}

export function DashboardButtonLink(props: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={props.href}
      className="inline-flex items-center justify-center rounded-xl bg-[#6D5EF5] px-3.5 py-2 text-sm/6 font-semibold text-white transition hover:bg-[#5f51e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]"
    >
      {props.label}
    </Link>
  );
}

export function DashboardSelect(props: {
  value: string;
  onChange?: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      value={props.value}
      onChange={(event) => props.onChange?.(event.target.value)}
      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 sm:w-auto"
    >
      {props.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function metricValueTone(tone?: DashboardMetric["tone"]) {
  const toneClass =
    tone === "critical"
      ? "text-rose-600 dark:text-rose-300"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-300"
        : tone === "success"
          ? "text-emerald-600 dark:text-emerald-300"
          : "text-slate-900 dark:text-white";

  return `mt-2 text-[2rem] font-semibold tracking-tight ${toneClass}`;
}

function badgeTone(tone: "critical" | "warning" | "success" | "neutral" = "neutral") {
  if (tone === "critical") return "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-300/20";
  if (tone === "warning") return "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-300/20";
  if (tone === "success") return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-300/20";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10";
}

function barTone(tone?: "critical" | "warning" | "success") {
  if (tone === "critical") return "bg-rose-400";
  if (tone === "warning") return "bg-amber-300";
  if (tone === "success") return "bg-emerald-400";
  return "bg-indigo-400";
}

function headerAlignment(align: "left" | "right" | "center" = "left") {
  if (align === "right") return "px-4 py-3 text-right";
  if (align === "center") return "px-4 py-3 text-center";
  return "px-4 py-3 text-left";
}

function cellAlignment(align: "left" | "right" | "center" = "left") {
  if (align === "right") return "break-words px-4 py-3 text-right align-top";
  if (align === "center") return "break-words px-4 py-3 text-center align-top";
  return "break-words px-4 py-3 text-left align-top";
}
