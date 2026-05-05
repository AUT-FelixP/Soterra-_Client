"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

type RepositoryItem = {
  id: string;
  name: string;
  type: "Files" | "Folder" | "Zip";
  itemCount: number;
  size: number;
  status: "Ready" | "Encrypted" | "Processing";
  uploadedAt: string;
};

const typeOptions = ["All", "Files", "Folder", "Zip"] as const;
const statusOptions = ["All", "Ready", "Encrypted", "Processing"] as const;
const requiredLabelClassName =
  "flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white";
const requiredBadgeClassName =
  "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-200";

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
  const [items, setItems] = useState<RepositoryItem[]>(loadStoredRepositoryItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    type: "All",
    status: "All",
    search: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(repositoryStorageKey, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      if (filters.type !== "All" && item.type !== filters.type) return false;
      if (filters.status !== "All" && item.status !== filters.status) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
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
  const queuedFolderCount = new Set(
    queuedFiles
      .map((file) => getRootFolder(file))
      .filter((folder): folder is string => Boolean(folder))
  ).size;
  const queuedZipCount = queuedFiles.filter((file) => isZipFile(file)).length;

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

  function removeSelectedItems() {
    setItems((current) => current.filter((item) => !selectedIds.includes(item.id)));
    setUploadMessage(`${selectedIds.length} repository item${selectedIds.length === 1 ? "" : "s"} removed.`);
    setSelectedIds([]);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    queueFiles(event.dataTransfer.files);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setUploadMessage("");
    setUploadError("");

    if (queuedFiles.length === 0) {
      setUploadError("Choose files, folders, or zip contents before uploading.");
      return;
    }

    setSubmitting(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const projectName = String(form.get("projectName") ?? "").trim();
    const siteName = String(form.get("siteName") ?? "").trim();
    const encrypted = form.get("encryptFiles") === "on";
    const zipContents = form.get("zipContents") === "on";
    const extractableFiles = queuedFiles.filter(isPdfFile);
    const repositoryOnlyFiles = queuedFiles.filter((file) => !isPdfFile(file));
    const folderGroups = groupFilesByFolder(repositoryOnlyFiles);
    const looseFiles = repositoryOnlyFiles.filter((file) => !getRootFolder(file));
    const nextItems: RepositoryItem[] = [];
    const timestamp = new Date().toISOString();

    const uploadedReports: RepositoryItem[] = [];
    const uploadErrors: string[] = [];

    for (const file of extractableFiles) {
      const reportForm = new FormData();
      reportForm.append("file", file);
      reportForm.append("project", projectName);
      reportForm.append("site", siteName);
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

        uploadedReports.push({
          id:
            typeof payload?.item?.id === "string" && payload.item.id.trim()
              ? payload.item.id
              : fileKey(file),
          name: file.webkitRelativePath || file.name,
          type: isZipFile(file) ? "Zip" : "Files",
          itemCount: 1,
          size: file.size,
          status:
            payload?.item?.status === "Completed" && !payload?.isProcessing
              ? "Ready"
              : "Processing",
          uploadedAt: timestamp,
        });
      } catch (error) {
        uploadErrors.push(
          `${file.name}: ${error instanceof Error ? error.message : "Failed to upload report."}`
        );
      }
    }

    if (looseFiles.length > 0) {
      nextItems.push({
        id: `repo-files-${Date.now()}`,
        name: projectName ? `${projectName} files` : `${looseFiles.length} uploaded file${looseFiles.length === 1 ? "" : "s"}`,
        type: zipContents || looseFiles.some(isZipFile) ? "Zip" : "Files",
        itemCount: looseFiles.length,
        size: looseFiles.reduce((total, file) => total + file.size, 0),
        status: encrypted ? "Encrypted" : "Ready",
        uploadedAt: timestamp,
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
      });
    });

    setItems((current) => [...uploadedReports, ...nextItems, ...current]);

    if (uploadErrors.length > 0) {
      setUploadError(uploadErrors.join(" "));
    }

    if (uploadedReports.length > 0 || repositoryOnlyFiles.length > 0) {
      setQueuedFiles([]);
      setModalOpen(false);
      formElement.reset();
    }

    if (uploadedReports.length > 0) {
      const repositoryOnlyMessage =
        repositoryOnlyFiles.length > 0
          ? ` ${repositoryOnlyFiles.length} non-PDF repository file${repositoryOnlyFiles.length === 1 ? "" : "s"} listed locally until backend file storage is available.`
          : "";
      setUploadMessage(
        `${uploadedReports.length} PDF report${uploadedReports.length === 1 ? "" : "s"} uploaded for extraction.${repositoryOnlyMessage}`
      );
    } else if (repositoryOnlyFiles.length > 0) {
      setUploadMessage(
        `${repositoryOnlyFiles.length} repository file${repositoryOnlyFiles.length === 1 ? "" : "s"} listed locally. Extraction currently runs for PDF reports only.`
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
              className="rounded-full border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-400/30 dark:bg-white/5 dark:text-rose-100 dark:hover:bg-rose-500/10"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={removeSelectedItems}
              className="rounded-full bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Remove selected
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950/80 dark:text-slate-400">
            <tr>
              <th className="w-12 px-6 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all visible repository items"
                  checked={allFilteredSelected}
                  disabled={filteredIds.length === 0}
                  onChange={toggleFilteredSelection}
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-40 dark:border-white/20 dark:bg-slate-950"
                />
              </th>
              <th className="px-6 py-3">Repository item</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Contents</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Uploaded</th>
              <th className="px-6 py-3 text-right">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="text-sm/6 text-slate-700 transition-colors even:bg-slate-50 hover:bg-slate-50 dark:text-slate-200 dark:even:bg-slate-950/25 dark:hover:bg-white/5"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.name}`}
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-white/20 dark:bg-slate-950"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {item.type}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {new Date(item.uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-slate-900 dark:text-white">
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
          className="fixed inset-0 bg-gray-900/60 transition-opacity data-closed:opacity-0"
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-2xl transform rounded-xl bg-white p-5 shadow-xl transition data-closed:scale-95 data-closed:opacity-0 dark:bg-gray-900 dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Upload repository content
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add files, complete folders, or zip contents for client repository storage.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Fields marked as <span className={requiredBadgeClassName}>Required</span> must
              be completed before upload.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {uploadError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {uploadError}
                </div>
              ) : null}

              <div>
                <label className={requiredLabelClassName}>
                  Repository content
                  <span className={requiredBadgeClassName}>Required</span>
                </label>
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-indigo-300 dark:border-white/10 dark:bg-slate-950/55"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Drop files, folders, or zip files here
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Multiple selections are accepted. Folder paths are preserved by the browser where supported.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
                    >
                      Choose files or zips
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        folderInputRef.current?.setAttribute("webkitdirectory", "");
                        folderInputRef.current?.setAttribute("directory", "");
                        folderInputRef.current?.click();
                      }}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-xs inset-ring inset-ring-slate-300 hover:bg-slate-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                    >
                      Choose folders
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip,application/zip,application/pdf,image/*"
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
              </div>

              {queuedFiles.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/55">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {queuedFiles.length} file{queuedFiles.length === 1 ? "" : "s"} selected
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {queuedFolderCount} folder{queuedFolderCount === 1 ? "" : "s"} detected, {queuedZipCount} zip file{queuedZipCount === 1 ? "" : "s"}, {formatBytes(queuedSize)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQueuedFiles([])}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      Clear queue
                    </button>
                  </div>
                  <div className="mt-4 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                    {queuedFiles.slice(0, 8).map((file) => (
                      <div
                        key={fileKey(file)}
                        className="flex items-center justify-between gap-4 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 dark:border-white/10"
                      >
                        <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">
                          {file.webkitRelativePath || file.name}
                        </span>
                        <span className="shrink-0 text-slate-500 dark:text-slate-400">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    ))}
                    {queuedFiles.length > 8 ? (
                      <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                        + {queuedFiles.length - 8} more
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div>
                <label className={requiredLabelClassName}>
                  Project or repository name
                  <span className={requiredBadgeClassName}>Required</span>
                </label>
                <input
                  name="projectName"
                  required
                  placeholder="Enter project or repository name"
                  className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-amber-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-amber-300/60 dark:focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className={requiredLabelClassName}>
                  Site
                  <span className={requiredBadgeClassName}>Required</span>
                </label>
                <input
                  name="siteName"
                  required
                  placeholder="Enter site name"
                  className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-amber-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-amber-300/60 dark:focus:outline-indigo-500"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <input
                    name="zipContents"
                    type="checkbox"
                    className="mt-1 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-white/20 dark:bg-slate-950"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900 dark:text-white">
                      Zip contents
                    </span>
                    Package selected folders or file groups before backend handoff.
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <input
                    name="encryptFiles"
                    type="checkbox"
                    defaultChecked
                    className="mt-1 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-white/20 dark:bg-slate-950"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900 dark:text-white">
                      Encrypt files
                    </span>
                    Mark uploaded content for encrypted repository storage.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {submitting ? "Uploading..." : "Upload content"}
                </button>
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

function isPdfFile(file: File) {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
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
