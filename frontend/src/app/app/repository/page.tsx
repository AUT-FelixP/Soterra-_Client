"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type RepositoryItem = {
  id: string;
  name: string;
  type: "Files" | "Folder" | "Zip";
  itemCount: number;
  size: number;
  status: "Ready" | "Encrypted" | "Processing";
  uploadedAt: string;
  project?: string;
  site?: string;
};

type ApiReport = {
  id?: unknown;
  project?: unknown;
  site?: unknown;
  sourceFileName?: unknown;
  status?: unknown;
  issues?: unknown;
  uploadedAt?: unknown;
  createdAt?: unknown;
};

type NormalizedApiReport = ApiReport & { id: string };

const typeOptions = ["All", "Files", "Folder", "Zip"] as const;
const statusOptions = ["All", "Ready", "Encrypted", "Processing"] as const;
const modalInputClassName =
  "block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500";

const repositoryStorageKey = "soterra-repository-items";

function getUploadErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;

  const detail = "detail" in payload ? payload.detail : null;
  if (typeof detail === "string" && detail.trim()) return detail;

  const message = "message" in payload ? payload.message : null;
  if (typeof message === "string" && message.trim()) return message;

  const error = "error" in payload ? payload.error : null;
  if (typeof error === "string" && error.trim()) return error;

  return null;
}

export default function RepositoryPage() {
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [itemsHydrated, setItemsHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [filters, setFilters] = useState({
    type: "All",
    status: "All",
    search: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setItems(loadStoredRepositoryItems());
    setItemsHydrated(true);
  }, []);

  useEffect(() => {
    if (!itemsHydrated) return;
    window.localStorage.setItem(repositoryStorageKey, JSON.stringify(items));
  }, [items, itemsHydrated]);

  useEffect(() => {
    if (!itemsHydrated) return;
    let cancelled = false;

    async function syncBackendReports() {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!response.ok || cancelled) return;

        const backendReports = getApiReports(payload);
        const backendReportIds = new Set(backendReports.map((report) => report.id));
        const backendReportItems = backendReports.map(apiReportToRepositoryItem);

        setItems((current) => {
          const repositoryOnlyItems = current.filter((item) => !item.id.startsWith("rpt-"));
          const localBackendItems = current.filter(
            (item) => item.id.startsWith("rpt-") && backendReportIds.has(item.id)
          );
          const backendItemById = new Map(backendReportItems.map((item) => [item.id, item]));
          const syncedBackendItems = localBackendItems.map((item) =>
            mergeBackendRepositoryItem(item, backendItemById.get(item.id))
          );
          const syncedBackendIds = new Set(syncedBackendItems.map((item) => item.id));
          const missingBackendItems = backendReportItems.filter((item) => !syncedBackendIds.has(item.id));

          return [...missingBackendItems, ...syncedBackendItems, ...repositoryOnlyItems];
        });
      } catch {
        // Keep the last local view if the backend is temporarily unavailable.
      }
    }

    syncBackendReports();

    return () => {
      cancelled = true;
    };
  }, [itemsHydrated]);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      if (filters.type !== "All" && item.type !== filters.type) return false;
      if (filters.status !== "All" && item.status !== filters.status) return false;
      if (
        query &&
        ![item.name, item.project, item.site].some((value) =>
          value?.toLowerCase().includes(query)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [filters, items]);

  const filteredIds = useMemo(
    () => filteredItems.map((item) => item.id),
    [filteredItems]
  );
  const selectedCount = selectedIds.length;
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const queuedSize = queuedFiles.reduce((total, file) => total + file.size, 0);
  const canUpload = queuedFiles.length > 0 && projectName.trim().length > 0 && siteName.trim().length > 0 && !submitting;

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  function queueFiles(nextFiles: FileList | File[]) {
    const files = Array.from(nextFiles);
    setQueuedFiles((current) => {
      const seen = new Set(current.map(fileKey));
      const merged = [...current];

      files.forEach((file) => {
        const key = fileKey(file);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(file);
        }
      });

      return merged;
    });
    setUploadError("");
  }

  function toggleItemSelection(itemId: string) {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  }

  function toggleFilteredSelection() {
    if (allFilteredSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...filteredIds])));
  }

  async function removeSelectedItems() {
    if (selectedIds.length === 0 || removing) return;

    setRemoving(true);
    setUploadError("");
    setUploadMessage("");

    const selectedBackendReportIds = selectedIds.filter((id) => id.startsWith("rpt-"));
    const deletedBackendReportIds: string[] = [];

    try {
      if (selectedBackendReportIds.length > 0) {
        const response = await fetch("/api/reports", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedBackendReportIds }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.detail ?? payload?.message ?? "Unable to delete selected reports.");
        }
        if (Array.isArray(payload?.deleted)) {
          deletedBackendReportIds.push(...payload.deleted);
        }
        if (Array.isArray(payload?.missing)) {
          deletedBackendReportIds.push(...payload.missing);
        }
      }

      const removableIds = new Set([
        ...selectedIds.filter((id) => !id.startsWith("rpt-")),
        ...deletedBackendReportIds,
      ]);
      setItems((current) => current.filter((item) => !removableIds.has(item.id)));
      setSelectedIds((current) => current.filter((id) => !removableIds.has(id)));
      setUploadMessage(`${removableIds.size} repository item${removableIds.size === 1 ? "" : "s"} removed.`);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Unable to remove selected repository items."
      );
    } finally {
      setRemoving(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    queueFiles(event.dataTransfer.files);
  }

  function removeQueuedFile(targetFile: File) {
    const targetKey = fileKey(targetFile);
    setQueuedFiles((current) => current.filter((file) => fileKey(file) !== targetKey));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setUploadMessage("");
    setUploadError("");

    if (queuedFiles.length === 0) {
      setUploadError("Choose at least one PDF or Word report before uploading.");
      return;
    }

    setSubmitting(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const nextProjectName = projectName.trim();
    const nextSiteName = siteName.trim();
    const encrypted = form.get("encryptFiles") === "on";
    const zipContents = form.get("zipContents") === "on";
    const extractableFiles = queuedFiles.filter(isSupportedReportFile);
    const repositoryOnlyFiles = queuedFiles.filter((file) => !isSupportedReportFile(file));
    const folderGroups = groupFilesByFolder(repositoryOnlyFiles);
    const looseFiles = repositoryOnlyFiles.filter((file) => !getRootFolder(file));
    const nextItems: RepositoryItem[] = [];
    const timestamp = new Date().toISOString();

    const uploadedReports: RepositoryItem[] = [];
    const uploadErrors: string[] = [];
    const uploadCount = extractableFiles.length + repositoryOnlyFiles.length;

    setModalOpen(false);
    setQueuedFiles([]);
    setProjectName("");
    setSiteName("");
    formElement.reset();
    setUploadMessage(
      uploadCount > 0
        ? `Uploading ${uploadCount} file${uploadCount === 1 ? "" : "s"}...`
        : ""
    );

    if (extractableFiles.length > 0) {
      for (const sourceFile of extractableFiles) {
        const reportForm = new FormData();
        reportForm.append("file", sourceFile);
        reportForm.append("project", nextProjectName);
        reportForm.append("site", nextSiteName);
        reportForm.append("status", "Reviewing");
        reportForm.append("trade", "General");

        try {
          const response = await fetch("/api/reports", {
            method: "POST",
            body: reportForm,
          });
          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(getUploadErrorMessage(payload) ?? "Failed to upload report.");
          }

          const result = {
            filename: sourceFile.name,
            item: payload?.item as { id?: unknown; status?: unknown } | undefined,
            isProcessing: payload?.isProcessing,
          };

          uploadedReports.push({
            id:
              typeof result.item?.id === "string" && result.item.id.trim()
                ? result.item.id
                : fileKey(sourceFile),
            name: sourceFile.webkitRelativePath || result.filename,
            type: "Files",
            itemCount: 1,
            size: sourceFile.size,
            status:
              result.item?.status === "Completed" && !result.isProcessing
                ? "Ready"
                : "Processing",
            uploadedAt: timestamp,
            project: nextProjectName,
            site: nextSiteName,
          });
        } catch (error) {
          uploadErrors.push(
            `${sourceFile.name}: ${error instanceof Error ? normalizeUploadError(error.message) : "Failed to upload report."}`
          );
        }
      }
    }

    if (looseFiles.length > 0) {
      nextItems.push({
        id: `repo-files-${Date.now()}`,
        name: nextProjectName ? `${nextProjectName} files` : `${looseFiles.length} uploaded file${looseFiles.length === 1 ? "" : "s"}`,
        type: zipContents || looseFiles.some(isZipFile) ? "Zip" : "Files",
        itemCount: looseFiles.length,
        size: looseFiles.reduce((total, file) => total + file.size, 0),
        status: encrypted ? "Encrypted" : "Ready",
        uploadedAt: timestamp,
        project: nextProjectName,
        site: nextSiteName,
      });
    }

    folderGroups.forEach((files, folderName) => {
      nextItems.push({
        id: `repo-folder-${Date.now()}-${folderName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: zipContents ? `${folderName}.zip` : folderName,
        type: zipContents ? "Zip" : "Folder",
        itemCount: files.length,
        size: files.reduce((total, file) => total + file.size, 0),
        status: encrypted ? "Encrypted" : "Ready",
        uploadedAt: timestamp,
        project: nextProjectName,
        site: nextSiteName,
      });
    });

    setItems((current) => [...uploadedReports, ...nextItems, ...current]);

    if (uploadErrors.length > 0) {
      setUploadError(uploadErrors.join(" "));
    }

    if (uploadedReports.length > 0) {
      const repositoryOnlyMessage =
        repositoryOnlyFiles.length > 0
            ? ` ${repositoryOnlyFiles.length} unsupported repository file${repositoryOnlyFiles.length === 1 ? "" : "s"} listed locally until backend file storage is available.`
            : "";
      setUploadMessage(
        `${uploadedReports.length} report${uploadedReports.length === 1 ? "" : "s"} uploaded for extraction.${repositoryOnlyMessage}`
      );
    } else if (repositoryOnlyFiles.length > 0) {
      setUploadMessage(
        `${repositoryOnlyFiles.length} repository file${repositoryOnlyFiles.length === 1 ? "" : "s"} listed locally. Extraction currently runs for PDF and Word reports only.`
      );
    }

    setSubmitting(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Repository
          </h1>
          <p className="mt-2 text-sm/6 text-slate-600 dark:text-slate-300">
            Upload client files, folders, and zip contents into the project repository.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
        >
          Upload Content
        </button>
      </div>

      {uploadMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm/6 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          {uploadMessage}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              Search
            </label>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Find repository item"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, type: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:*:bg-slate-950 dark:*:text-white"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:*:bg-slate-950 dark:*:text-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFilters({ type: "All", status: "All", search: "" })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm/6 font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm/6 text-rose-900 sm:flex-row sm:items-center sm:justify-between dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100">
          <span>
            {selectedCount} repository item{selectedCount === 1 ? "" : "s"} selected
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={removing}
              className="rounded-full border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-70 dark:border-rose-400/30 dark:bg-white/5 dark:text-rose-100 dark:hover:bg-rose-500/10"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={removeSelectedItems}
              disabled={removing}
              className="rounded-full bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-70"
            >
              {removing ? "Removing..." : "Remove selected"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-white/10">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/80 dark:text-slate-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all visible repository items"
                  checked={allFilteredSelected}
                  disabled={filteredIds.length === 0}
                  onChange={toggleFilteredSelection}
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-40 dark:border-white/20 dark:bg-slate-950"
                />
              </th>
              <th className="w-[24%] px-4 py-3">Repository item</th>
              <th className="w-[15%] px-4 py-3">Project</th>
              <th className="w-[15%] px-4 py-3">Site</th>
              <th className="w-[8%] px-4 py-3">Type</th>
              <th className="w-[10%] px-4 py-3">Contents</th>
              <th className="w-[10%] px-4 py-3">Status</th>
              <th className="w-[12%] px-4 py-3">Uploaded</th>
              <th className="w-[8%] px-4 py-3 text-right">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="text-sm/6 text-slate-700 transition-colors even:bg-slate-50 hover:bg-slate-50 dark:text-slate-200 dark:even:bg-slate-950/25 dark:hover:bg-white/5"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.name}`}
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-white/20 dark:bg-slate-950"
                  />
                </td>
                <td className="break-words px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">
                  {item.name}
                </td>
                <td className="break-words px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {displayMetadata(item.project)}
                </td>
                <td className="break-words px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {displayMetadata(item.site)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {item.type}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {new Date(item.uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-4 text-right text-sm font-medium text-slate-900 dark:text-white">
                  {formatBytes(item.size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm/6 text-slate-500 dark:text-slate-400">
            No repository items match the selected filters.
          </div>
        ) : null}
      </div>

      <Dialog open={modalOpen} onClose={setModalOpen} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity data-closed:opacity-0"
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl transform flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-white/10 transition data-closed:scale-95 data-closed:opacity-0"
          >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold text-white">
                    Upload inspection reports
                  </DialogTitle>
                  <p className="mt-1 text-sm/6 text-gray-400">
                    Add PDF or Word reports for a project or site. We&apos;ll organise them for analysis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  <XMarkIcon className="size-5" aria-hidden="true" />
                  <span className="sr-only">Close upload modal</span>
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                {uploadError ? (
                  <div className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm/6 text-rose-100">
                    {uploadError}
                  </div>
                ) : null}

                <section>
                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center transition hover:border-indigo-400/60 hover:bg-white/[0.05]"
                  >
                    <p className="text-sm font-semibold text-white">
                      Drop PDF or Word reports here
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      or choose files from your computer
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                      >
                        Choose files
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          folderInputRef.current?.setAttribute("webkitdirectory", "");
                          folderInputRef.current?.setAttribute("directory", "");
                          folderInputRef.current?.click();
                        }}
                        className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                      >
                        Choose folder
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => {
                        if (event.currentTarget.files) {
                          queueFiles(event.currentTarget.files);
                        }
                        event.currentTarget.value = "";
                      }}
                      className="sr-only"
                    />
                    <input
                      ref={folderInputRef}
                      type="file"
                      multiple
                      onChange={(event) => {
                        if (event.currentTarget.files) {
                          queueFiles(event.currentTarget.files);
                        }
                        event.currentTarget.value = "";
                      }}
                      className="sr-only"
                    />
                  </div>
                </section>

                {queuedFiles.length > 0 ? (
                  <section className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Selected reports</h3>
                        <p className="mt-1 text-xs/5 text-gray-400">
                          {queuedFiles.length} report{queuedFiles.length === 1 ? "" : "s"} selected • {formatBytes(queuedSize)}
                        </p>
                        <p className="mt-1 text-xs/5 text-gray-400">
                          PDF or Word only, max 50 MB per file.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQueuedFiles([])}
                        className="self-start rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:self-auto"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/15">
                      {queuedFiles.map((file) => (
                        <div
                          key={fileKey(file)}
                          className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5 last:border-b-0"
                        >
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-200">
                            <DocumentTextIcon className="size-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-100">
                              {file.webkitRelativePath || file.name}
                            </p>
                            <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQueuedFile(file)}
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                          >
                            <XMarkIcon className="size-4" aria-hidden="true" />
                            <span className="sr-only">Remove {file.name}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="repository-project-name" className="block text-sm font-medium text-gray-200">
                        Project name <span className="text-indigo-300">*</span>
                      </label>
                      <input
                        id="repository-project-name"
                        name="projectName"
                        required
                        value={projectName}
                        onChange={(event) => setProjectName(event.target.value)}
                        placeholder="Kauri Apartments"
                        className={`${modalInputClassName} mt-2`}
                      />
                    </div>
                    <div>
                      <label htmlFor="repository-site-name" className="block text-sm font-medium text-gray-200">
                        Site <span className="text-indigo-300">*</span>
                      </label>
                      <input
                        id="repository-site-name"
                        name="siteName"
                        required
                        value={siteName}
                        onChange={(event) => setSiteName(event.target.value)}
                        placeholder="24 Kauri Road"
                        className={`${modalInputClassName} mt-2`}
                      />
                    </div>
                  </div>
                </section>

                <details className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-gray-200 outline-none focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                    Advanced options
                    <span className="ml-2 text-xs font-normal text-gray-500 group-open:hidden">Show</span>
                    <span className="ml-2 hidden text-xs font-normal text-gray-500 group-open:inline">Hide</span>
                  </summary>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-start gap-3 text-sm text-gray-300">
                      <input
                        name="zipContents"
                        type="checkbox"
                        className="mt-1 size-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span>
                        <span className="block font-medium text-gray-100">Package files before upload</span>
                        <span className="text-xs/5 text-gray-500">Useful when uploading folders.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-gray-300">
                      <input
                        name="encryptFiles"
                        type="checkbox"
                        defaultChecked
                        className="mt-1 size-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span>
                        <span className="block font-medium text-gray-100">Keep files protected</span>
                        <span className="text-xs/5 text-gray-500">Recommended for inspection reports.</span>
                      </span>
                    </label>
                  </div>
                </details>
              </div>

              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-white/10 bg-gray-900/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-gray-400">
                  {queuedFiles.length > 0
                    ? `${queuedFiles.length} report${queuedFiles.length === 1 ? "" : "s"} ready to upload`
                    : "Choose PDF or Word reports to continue"}
                </p>
                <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canUpload}
                    className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Uploading..." : "Upload content"}
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}

function fileKey(file: File) {
  return `${file.webkitRelativePath || file.name}-${file.size}-${file.lastModified}`;
}

function getRootFolder(file: File) {
  const path = file.webkitRelativePath;
  if (!path || !path.includes("/")) return "";
  return path.split("/")[0];
}

function isZipFile(file: File) {
  return file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip";
}

function isSupportedReportFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    file.type === "application/pdf" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function groupFilesByFolder(files: File[]) {
  const groups = new Map<string, File[]>();

  files.forEach((file) => {
    const folder = getRootFolder(file);
    if (!folder) return;
    groups.set(folder, [...(groups.get(folder) ?? []), file]);
  });

  return groups;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeUploadError(message: string) {
  if (message.includes("already been uploaded")) return "This file has already been uploaded.";
  if (message.includes("FUNCTION_PAYLOAD_TOO_LARGE") || message.includes("Request Entity Too Large")) {
    return "This file is too large for the Vercel upload proxy. Upload a smaller file or use direct storage upload.";
  }
  if (message.includes("PDF appears") || message.includes("Word document appears") || message.includes("corrupted")) {
    return "The file appears to be corrupted or unreadable.";
  }
  if (message.includes("security scanning")) return "This file failed security scanning and cannot be uploaded.";
  if (message.includes("Bulk upload is too large")) return "Bulk upload is too large. Upload fewer files or split the upload.";
  if (message.includes("Only PDF and Word")) return "Only PDF and Word documents are supported.";
  return message;
}

function isRepositoryItem(value: unknown): value is RepositoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RepositoryItem>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    (item.type === "Files" || item.type === "Folder" || item.type === "Zip") &&
    typeof item.itemCount === "number" &&
    typeof item.size === "number" &&
    (item.status === "Ready" || item.status === "Encrypted" || item.status === "Processing") &&
    typeof item.uploadedAt === "string"
  );
}

function getApiReports(payload: unknown): NormalizedApiReport[] {
  const items = payload && typeof payload === "object" && "items" in payload ? payload.items : null;
  if (!Array.isArray(items)) return [];

  return items.filter((item): item is NormalizedApiReport => {
    if (!item || typeof item !== "object") return false;
    const report = item as ApiReport;
    return typeof report.id === "string" && report.id.trim().length > 0;
  });
}

function apiReportToRepositoryItem(report: NormalizedApiReport): RepositoryItem {
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const status = typeof report.status === "string" ? report.status : "";
  const uploadedAt =
    typeof report.uploadedAt === "string" && report.uploadedAt.trim()
      ? report.uploadedAt
      : typeof report.createdAt === "string" && report.createdAt.trim()
        ? report.createdAt
        : new Date().toISOString();

  return {
    id: report.id,
    name: reportName(report),
    type: "Files",
    itemCount: 1,
    size: 0,
    status: status === "Completed" || issues.length > 0 ? "Ready" : "Processing",
    uploadedAt,
    project: stringValue(report.project),
    site: stringValue(report.site),
  };
}

function mergeBackendRepositoryItem(current: RepositoryItem, backendItem: RepositoryItem | undefined): RepositoryItem {
  if (!backendItem) return current;

  return {
    ...backendItem,
    size: current.size,
    uploadedAt: backendItem.uploadedAt || current.uploadedAt,
    project: backendItem.project || current.project,
    site: backendItem.site || current.site,
  };
}

function reportName(report: ApiReport) {
  if (typeof report.sourceFileName === "string" && report.sourceFileName.trim()) {
    return report.sourceFileName;
  }
  if (typeof report.project === "string" && report.project.trim()) {
    return report.project;
  }
  if (typeof report.site === "string" && report.site.trim()) {
    return report.site;
  }
  return "Inspection report";
}

function loadStoredRepositoryItems() {
  if (typeof window === "undefined") return [];

  const storedItems = window.localStorage.getItem(repositoryStorageKey);
  if (!storedItems) return [];

  try {
    const parsed = JSON.parse(storedItems);
    return Array.isArray(parsed) ? parsed.filter(isRepositoryItem) : [];
  } catch {
    window.localStorage.removeItem(repositoryStorageKey);
    return [];
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function displayMetadata(value: string | undefined) {
  return value?.trim() || "Not specified";
}
