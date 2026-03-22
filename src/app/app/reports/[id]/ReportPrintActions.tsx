"use client";

export function ReportPrintActions() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
    >
      Download PDF
    </button>
  );
}
