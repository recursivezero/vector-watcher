import type { LanceTableDetails, LanceTableItem } from "@/api/lance";

import LanceMetadataPanel from "./LanceMetadataPanel";
import LanceSchemaPanel from "./LanceSchemaPanel";
import LanceSummaryCards from "./LanceSummaryCards";

interface DatabaseTabProps {
  tables: LanceTableItem[];
  selectedTable: string | null;
  details: LanceTableDetails | null;
  loading: boolean;
  onSelectTable: (table: string) => void;
  onRefresh: () => void;
}

export default function DatabaseTab({
  tables,
  selectedTable,
  details,
  loading,
  onSelectTable,
  onRefresh
}: DatabaseTabProps) {
  return (
    <div className="database-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Database</span>
          <h1>Database overview</h1>
          <p>Inspect tables, schema, vectors and LanceDB metadata.</p>
        </div>

        <button type="button" className="button button-secondary" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing…" : "Rescan"}
        </button>
      </div>

      <div className="table-picker surface">
        <div>
          <span className="eyebrow">Tables</span>
          <strong>{tables.length} available</strong>
        </div>

        <select
          value={selectedTable ?? ""}
          onChange={(event) => onSelectTable(event.target.value)}
          disabled={loading || tables.length === 0}
        >
          {tables.length === 0 ? (
            <option value="">No tables</option>
          ) : (
            tables.map((table) => (
              <option key={table.name} value={table.name}>
                {table.name}
              </option>
            ))
          )}
        </select>
      </div>

      <LanceSummaryCards tableCount={tables.length} details={details} loading={loading} />

      <div className="database-panels">
        <LanceSchemaPanel fields={details?.schema ?? []} loading={loading} />

        <LanceMetadataPanel
          metadata={details?.schema_metadata ?? {}}
          embeddingFunctions={details?.embedding_functions ?? []}
          vectorColumns={details?.vector_columns ?? []}
          loading={loading}
        />
      </div>
    </div>
  );
}
