import type { LanceDataSource, LanceTableItem } from "@/api/lance";

interface LanceScanToolbarProps {
  source: LanceDataSource;
  tables: LanceTableItem[];
  selectedTable: string | null;
  loading: boolean;
  refreshing: boolean;
  onSelect: (tableName: string) => void;
  onRefresh: () => void;
  onChangeSource: () => void;
  onLock: () => void;
}

export default function LanceScanToolbar({
  source,
  tables,
  selectedTable,
  loading,
  refreshing,
  onSelect,
  onRefresh,
  onChangeSource,
  onLock,
}: LanceScanToolbarProps) {
  return (
    <div className="lance-admin-toolbar">
      <div className="lance-admin-toolbar__source">
        <span>Storage</span>
        <strong>{source.storage === "r2" ? "Cloudflare R2" : source.storage}</strong>
        <code>{source.path || "—"}</code>
      </div>

      <div className="lance-admin-toolbar__table">
        <span>Table</span>
        <select value={selectedTable ?? ""} onChange={(event) => onSelect(event.target.value)} disabled={loading || tables.length === 0}>
          {tables.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name}
            </option>
          ))}
        </select>
      </div>

      <div className="lance-admin-toolbar__actions">
        <button type="button" className="lance-admin-button" onClick={onRefresh} disabled={loading || refreshing}>
          ↻ Rescan
        </button>

        <button type="button" className="lance-admin-button" onClick={onChangeSource} disabled={loading}>
          Change source
        </button>

        <button
          type="button"
          className="lance-admin-button lance-admin-button--lock"
          onClick={onLock}
          disabled={loading}
          title="Lock explorer"
        >
          <span className="lock-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          Lock explorer
        </button>
      </div>
    </div>
  );
}
