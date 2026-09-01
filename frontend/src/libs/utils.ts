import type {
  LanceDataSource,
  LanceRowDetail,
  LanceRowSummary,
  LanceSortColumn,
  LanceSortOrder,
  LanceStorageSelectType,
} from "@/api/lance";

export interface ExplorerQueryState {
  search: string;
  page: number;
  pageSize: number;
  tag: string;
  sortBy: LanceSortColumn | null;
  sortOrder: LanceSortOrder;
}

export const DEFAULT_EXPLORER_QUERY: ExplorerQueryState = {
  page: 1,
  pageSize: 25,
  tag: "",
  search: "",
  sortBy: null,
  sortOrder: "asc",
};

export function validateBucketName(storage: LanceStorageSelectType, bucket: string): string | null {
  const value = bucket.trim();

  if (!value) {
    return "A bucket name is required.";
  }

  if (value.length < 3 || value.length > 63) {
    return "The bucket name must be between 3 and 63 characters.";
  }

  if (storage === "r2") {
    if (!/^[a-z0-9](?:[a-z0-9-]{1,61})[a-z0-9]$/.test(value)) {
      return "The Cloudflare R2 bucket name is invalid.";
    }

    return null;
  }

  if (!/^[a-z0-9](?:[a-z0-9.-]{1,61})[a-z0-9]$/.test(value) || value.includes("..") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return "The Amazon S3 bucket name is invalid.";
  }

  return null;
}

export function validateLanceSource(source: LanceDataSource): string | null {
  const path = source.path?.trim() ?? "";

  if (path.length > 2048) {
    return "The LanceDB path must be 2,048 characters or fewer.";
  }

  if (path.includes("\0")) {
    return "The LanceDB path contains an invalid character.";
  }

  if (source.storage === "local") {
    return null;
  }

  const bucketError = validateBucketName(source.storage, source.bucket);

  if (bucketError) {
    return bucketError;
  }

  if (!path) {
    return "A LanceDB database path is required.";
  }

  return null;
}

export function resetExplorerQuery(): ExplorerQueryState {
  return { ...DEFAULT_EXPLORER_QUERY };
}

export function applyExplorerTag(state: ExplorerQueryState, tag: string): ExplorerQueryState {
  return { ...state, tag: tag.trim(), page: 1 };
}

export function applyExplorerSort(
  state: ExplorerQueryState,
  sortBy: LanceSortColumn | null,
  sortOrder: LanceSortOrder,
): ExplorerQueryState {
  return { ...state, sortBy, sortOrder, page: 1 };
}

export function applyExplorerPageSize(state: ExplorerQueryState, pageSize: number): ExplorerQueryState {
  return { ...state, pageSize, page: 1 };
}

export function formatLanceMtime(value: number | string | null): string {
  if (value === null || value === "") return "—";

  const numeric = typeof value === "number" ? value : Number(value);
  const date = Number.isFinite(numeric) ? new Date(Math.abs(numeric) < 1_000_000_000_000 ? numeric * 1000 : numeric) : new Date(value);

  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function compactValue(value: string | null, length = 28): string {
  if (!value) return "—";
  if (value.length <= length) return value;
  const edge = Math.max(4, Math.floor((length - 1) / 2));
  return `${value.slice(0, edge)}…${value.slice(-edge)}`;
}

export function rowCopyPayload(row: LanceRowSummary): string {
  return JSON.stringify(row, null, 2);
}

export function completeRowCopyPayload(row: LanceRowDetail): string {
  return JSON.stringify(row, null, 2);
}

export async function writeTextToClipboard(value: string): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // Some browsers expose the Clipboard API but reject it outside a secure
    // context. Fall back to a temporary textarea in that case.
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard access is unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "-9999px auto auto -9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) throw new Error("Clipboard copy was rejected.");
  } finally {
    textarea.remove();
  }
}


export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (Array.isArray(error)) {
    return error
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string") {
          return item.msg;
        }

        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (typeof error === "object" && error !== null) {
    if ("detail" in error && typeof error.detail === "string") {
      return error.detail;
    }

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    return JSON.stringify(error);
  }

  return "An unexpected error occurred.";
};