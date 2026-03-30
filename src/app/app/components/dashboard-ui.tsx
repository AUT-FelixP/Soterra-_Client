"use client";

import Link from "next/link";

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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {props.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
            {props.eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {props.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">{props.description}</p>
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
    <section className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.28)] backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{props.title}</h2>
          {props.description ? (
            <p className="mt-1 text-sm text-slate-400">{props.description}</p>
          ) : null}
        </div>
        {props.action ? <div className="shrink-0">{props.action}</div> : null}
      </div>
      <div className="mt-6">{props.children}</div>
    </section>
  );
}

export function DashboardMetricGrid({ items }: { items: DashboardMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
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
    <div className="flex flex-col gap-4 rounded-3xl border border-indigo-400/20 bg-indigo-500/10 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
          {props.label}
        </p>
        <div className="mt-2 text-sm text-slate-200">{props.children}</div>
      </div>
      {props.action ? <div className="shrink-0">{props.action}</div> : null}
    </div>
  );
}

export function DashboardTwoColumn(props: { children: React.ReactNode }) {
  return <div className="grid gap-6 xl:grid-cols-2">{props.children}</div>;
}

export function DashboardSubCard(props: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5">
      <h3 className="text-base font-semibold text-white">{props.title}</h3>
      {props.description ? (
        <p className="mt-1 text-sm text-slate-400">{props.description}</p>
      ) : null}
      <div className="mt-5">{props.children}</div>
    </div>
  );
}

export function DashboardDataTable<T>(props: {
  columns: TableColumn<T>[];
  rows: T[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-slate-950/80">
            <tr className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
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
          <tbody className="divide-y divide-white/10 bg-slate-900/30">
            {props.rows.map((row, index) => (
              <tr key={index} className="text-sm text-slate-200">
                {props.columns.map((column) => (
                  <td key={column.key} className={cellAlignment(column.align)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
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
  const maxValue = Math.max(...props.data.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
      <div className="flex h-44 items-end gap-3">
        {props.data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center">
            <div className="mb-2 text-xs font-medium text-slate-400">
              {item.formattedValue ?? item.value}
            </div>
            <div className="flex w-full flex-1 items-end rounded-t-xl bg-white/5">
              <div
                className={`w-full rounded-t-xl ${props.colorClassName ?? "bg-indigo-400"}`}
                style={{ height: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
              />
            </div>
            <div className="mt-3 text-xs font-medium text-slate-400">
              {item.label}
            </div>
          </div>
        ))}
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
            <span className="font-medium text-white">{item.label}</span>
            <span className="text-slate-300">
              {item.value}
              {props.suffix ?? "%"}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10">
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
        <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
          <span className="mt-1.5 size-2 rounded-full bg-indigo-300" />
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(
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
      className="inline-flex items-center justify-center rounded-full bg-[#6D5EF5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5f51e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D5EF5]"
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
      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 sm:w-auto"
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
      ? "text-rose-300"
      : tone === "warning"
        ? "text-amber-300"
        : tone === "success"
          ? "text-emerald-300"
          : "text-white";

  return `mt-3 text-4xl font-semibold tracking-tight ${toneClass}`;
}

function badgeTone(tone: "critical" | "warning" | "success" | "neutral" = "neutral") {
  if (tone === "critical") return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-300/20";
  if (tone === "warning") return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-300/20";
  if (tone === "success") return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/20";
  return "bg-white/10 text-slate-200 ring-1 ring-white/10";
}

function barTone(tone?: "critical" | "warning" | "success") {
  if (tone === "critical") return "bg-rose-400";
  if (tone === "warning") return "bg-amber-300";
  if (tone === "success") return "bg-emerald-400";
  return "bg-indigo-400";
}

function headerAlignment(align: "left" | "right" | "center" = "left") {
  if (align === "right") return "px-5 py-4 text-right";
  if (align === "center") return "px-5 py-4 text-center";
  return "px-5 py-4 text-left";
}

function cellAlignment(align: "left" | "right" | "center" = "left") {
  if (align === "right") return "px-5 py-4 text-right";
  if (align === "center") return "px-5 py-4 text-center";
  return "px-5 py-4 text-left";
}
