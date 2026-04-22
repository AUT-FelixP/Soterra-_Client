"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReportPrintActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteReport() {
    if (deleting) return;
    const confirmed = window.confirm("Delete this report and its extracted issues?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? payload?.message ?? "Unable to delete report.");
      }
      router.push("/app/reports");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete report.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
      >
        Download PDF
      </button>
      <button
        type="button"
        onClick={deleteReport}
        disabled={deleting}
        className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-xs hover:bg-rose-50 disabled:opacity-70 dark:border-rose-400/30 dark:bg-white/5 dark:text-rose-200 dark:hover:bg-rose-500/10"
      >
        {deleting ? "Deleting..." : "Delete report"}
      </button>
    </>
  );
}
