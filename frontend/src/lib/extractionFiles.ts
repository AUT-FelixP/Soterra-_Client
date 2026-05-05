export type ExtractionFileSummary = {
  id?: string | null;
  status?: string | null;
  issues?: unknown[] | null;
};

export type ExtractionFileState = {
  hasFiles: boolean;
  fileCount: number;
  extractedIssueCount: number;
};

export function getExtractionFileState(payload: unknown): ExtractionFileState {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "items" in payload && Array.isArray(payload.items)
      ? payload.items
      : [];

  const files = items.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const id = "id" in item ? item.id : null;
    return typeof id === "string" && id.trim().length > 0;
  }) as ExtractionFileSummary[];

  return {
    hasFiles: files.length > 0,
    fileCount: files.length,
    extractedIssueCount: files.reduce(
      (total, file) => total + (Array.isArray(file.issues) ? file.issues.length : 0),
      0
    ),
  };
}
