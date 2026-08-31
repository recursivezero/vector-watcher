import type {
  LanceDataSource,
  LancePagination as LancePaginationData,
  LanceRowDetail,
  LanceRowSummary,
  LanceTableDetails,
  LanceTableItem
} from "@/api/lancedbAdmin";

import LanceFilterBar from "./LanceFilterBar";
import LancePagination from "./LancePagination";
import LanceRowGrid from "./LanceRowGrid";
import LanceScanToolbar from "./LanceScanToolbar";
import LanceSummaryCards from "./LanceSummaryCards";
import VectorViewer from "./VectorViewer";

import type { ExplorerQueryState } from "@/libs/explorerUtils";

interface ExplorerTabProps {
  source: LanceDataSource;
  tables: LanceTableItem[];
  selectedTable: string | null;
  details: LanceTableDetails | null;
  rows: LanceRowSummary[];
  pagination: LancePaginationData | null;
  query: ExplorerQueryState;
  loading: boolean;
  refreshing: boolean;
  vectorRow: LanceRowSummary | null;
  vectorDetail: LanceRowDetail | null;
  vectorLoading: boolean;
  vectorError: string | null;
  vectorTrigger: HTMLButtonElement | null;

  search: string;
  onSearchChange: (search: string) => void;

  onSelectTable: (table: string) => void;
  onRefresh: () => void;
  onChangeSource: () => void;
  onLock: () => void;

  onTagApply: (tag: string) => void;
  onSortChange: (column: ExplorerQueryState["sortBy"], order: ExplorerQueryState["sortOrder"]) => void;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;

  onCopy: (value: string, message: string) => void;

  onViewVector: (row: LanceRowSummary, trigger: HTMLButtonElement) => void;

  onClearFilter: () => void;
  onCloseVector: () => void;
  onRetryVector: () => void;
}

export default function ExplorerTab({
  source,
  tables,
  selectedTable,
  details,
  rows,
  pagination,
  query,
  loading,
  refreshing,
  vectorRow,
  vectorDetail,
  vectorLoading,
  vectorError,
  vectorTrigger,
  onSelectTable,
  onRefresh,
  onChangeSource,
  onLock,
  onTagApply,
  onSortChange,
  onPageSizeChange,
  onPageChange,
  onCopy,
  onViewVector,
  onClearFilter,
  onCloseVector,
  onRetryVector,
  search,
  onSearchChange
}: ExplorerTabProps) {
  return (
    <div className="explorer-page">
      <LanceScanToolbar
        source={source}
        tables={tables}
        selectedTable={selectedTable}
        loading={loading}
        refreshing={refreshing}
        onSelect={onSelectTable}
        onRefresh={onRefresh}
        onChangeSource={onChangeSource}
        onLock={onLock}
      />

      {selectedTable && (
        <>
          <div className="explorer-heading">
            <div>
              <span className="eyebrow">Explorer</span>
              <h1>{selectedTable}</h1>
              <p>
                {details?.row_count?.toLocaleString() ?? "—"} rows
                {" · "}
                {details?.schema.length ?? "—"} fields
                {" · "}
                {details?.vector_columns[0]?.dimension
                  ? `${details.vector_columns[0].dimension}d vector`
                  : "No vector detected"}
              </p>
            </div>
          </div>

          <LanceSummaryCards tableCount={tables.length} details={details} loading={loading} />

          <div className="surface explorer-controls">
            <LanceFilterBar
              appliedTag={query.tag}
              sortBy={query.sortBy}
              sortOrder={query.sortOrder}
              pageSize={query.pageSize}
              loading={loading}
              onTagApply={onTagApply}
              onSortChange={onSortChange}
              onPageSizeChange={onPageSizeChange}
              search={search}
              onSearchChange={onSearchChange}
            />
          </div>

          <LanceRowGrid
            rows={rows}
            loading={loading}
            appliedTag={query.tag}
            onCopy={onCopy}
            onViewVector={onViewVector}
            onClearFilter={onClearFilter}
          />

          <LancePagination pagination={pagination} loading={loading} onPageChange={onPageChange} />
        </>
      )}

      <VectorViewer
        row={vectorRow}
        detail={vectorDetail}
        loading={vectorLoading}
        error={vectorError}
        returnFocusElement={vectorTrigger}
        onClose={onCloseVector}
        onCopy={onCopy}
        onRetry={onRetryVector}
      />
    </div>
  );
}
