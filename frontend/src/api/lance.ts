export const LANCE_STORAGE = {
  R2: "r2",
  S3: "s3",
  LOCAL: "local"
} as const;

export type LanceStorageType = (typeof LANCE_STORAGE)[keyof typeof LANCE_STORAGE];
export type LanceStorageSelectType = LanceStorageType | "";

export interface LanceDataSource {
  name: string;
  storage: LanceStorageSelectType;
  path: string;
  bucket: string;
  endpoint: string;
  access_key_id: string;
  secret_access_key: string;
  session_token?: string;
  region: string;
}

export interface LanceTableItem {
  name: string;
}

export interface LanceTablesResponse {
  source: {
    name: string;
    storage: LanceStorageType;
    path: string;
  };
  tables: LanceTableItem[];
}

export interface LanceSchemaField {
  name: string;
  type: string;
  nullable: boolean;
  is_vector: boolean;
}

export interface LanceVectorColumn {
  name: string;
  dimension: number;
}

export interface LanceEmbeddingFunction {
  name: string;
  source_column: string;
  vector_column: string;
}

export interface LanceTableDetails {
  name: string;
  row_count: number;
  schema: LanceSchemaField[];
  schema_metadata: Record<string, unknown>;
  embedding_functions: LanceEmbeddingFunction[];
  vector_columns: LanceVectorColumn[];
}

export type LanceSortColumn = "image_uri" | "tag" | "hash" | "mtime";

export type LanceSortOrder = "asc" | "desc";

export interface LanceVectorSummary {
  length: number;
  included: boolean;
}

export interface LanceRowSummary {
  row_id: number;
  image_uri: string | null;
  tag: string | null;
  hash: string | null;
  mtime: number | string | null;
  vector: LanceVectorSummary;
}

export interface LancePagination {
  page: number;
  page_size: number;
  total_rows: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface LanceFilterState {
  tag: string | null;
}

export interface LanceSortState {
  column: LanceSortColumn | null;
  order: LanceSortOrder;
}

export interface LanceRowsResponse {
  table: string;
  rows: LanceRowSummary[];
  pagination: LancePagination;
  filter: LanceFilterState;
  sort: LanceSortState;
}

export interface LanceVectorValues {
  length: number;
  values: number[];
}

export interface LanceRowDetail {
  row_id: number;
  image_uri: string | null;
  tag: string | null;
  hash: string | null;
  mtime: number | string | null;
  vector: LanceVectorValues;
}

export interface LanceExplorerCredentials {
  adminSecret: string;

  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    region: string;
    bucketName: string;
  };

  r2: {
    accessKeyId: string;
    secretAccessKey: string;
    accountId: string;
    bucketName: string;
    endpoint: string;
    region: string;
  };
}

export interface LanceConnectionState {
  name: string;
  storage: LanceStorageSelectType;
  path: string;
  bucket: string;
  endpoint: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8765";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String(payload.detail)
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload as T;
}

function toBackendConnection(connection: LanceConnectionState): LanceDataSource {
  const endpoint =
    connection.storage === "r2"
      ? `https://${connection.accountId.trim()}.r2.cloudflarestorage.com`
      : connection.endpoint.trim();

  return {
    name: connection.name,
    storage: connection.storage,
    path: connection.path,
    bucket: connection.bucket,
    endpoint,
    access_key_id: connection.accessKeyId,
    secret_access_key: connection.secretAccessKey,
    session_token: connection.sessionToken,
    region: connection.region || "auto"
  };
}

export async function scanConnection(connection: LanceConnectionState): Promise<LanceTablesResponse> {
  return request<LanceTablesResponse>("/connections/scan", {
    method: "POST",
    body: JSON.stringify(toBackendConnection(connection))
  });
}

export async function getTableDetails(connection: LanceConnectionState, table: string): Promise<LanceTableDetails> {
  return request<LanceTableDetails>(`/connections/table-details?table=${encodeURIComponent(table)}`, {
    method: "POST",
    body: JSON.stringify(toBackendConnection(connection))
  });
}

export async function getRows(
  connection: LanceConnectionState,
  table: string,
  options: {
    page: number;
    pageSize: number;
    search?: string;
    tag?: string;
    sortBy?: LanceSortColumn | null;
    sortOrder?: LanceSortOrder;
  }
): Promise<LanceRowsResponse> {
  const params = new URLSearchParams({
    table,
    page: String(options.page),
    page_size: String(options.pageSize)
  });

  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  if (options.tag) {
    params.set("tag", options.tag);
  }

  if (options.sortBy) {
    params.set("sort_by", options.sortBy);
  }

  if (options.sortOrder) {
    params.set("sort_order", options.sortOrder);
  }

  return request<LanceRowsResponse>(`/connections/rows?${params.toString()}`, {
    method: "POST",
    body: JSON.stringify(toBackendConnection(connection))
  });
}

export async function getRow(connection: LanceConnectionState, table: string, rowId: number): Promise<LanceRowDetail> {
  return request<LanceRowDetail>(`/connections/row?table=${encodeURIComponent(table)}&row_id=${rowId}`, {
    method: "POST",
    body: JSON.stringify(toBackendConnection(connection))
  });
}

export async function checkHealth(): Promise<{
  status: string;
  service: string;
}> {
  return request("/health");
}
