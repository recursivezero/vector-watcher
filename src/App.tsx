import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  LanceConnectionState,
  LanceDataSource,
  LancePagination,
  LanceRowDetail,
  LanceRowSummary,
  LanceTableDetails,
  LanceTableItem,
} from "@/api/lancedbAdmin";

import { getRow, getRows, getTableDetails, scanConnection } from "@/api/lancedbAdmin";

import ConnectionTab from "@/components/ConnectionTab";
import DatabaseTab from "@/components/DatabaseTab";
import ExplorerTab from "@/components/ExplorerTab";

import { DEFAULT_EXPLORER_QUERY, type ExplorerQueryState, writeTextToClipboard } from "@/lib/explorerUtils";

type AppTab = "connection" | "database" | "explorer";

const EMPTY_CONNECTION: LanceConnectionState = {
  name: "Threadzip R2",
  storage: "r2",
  path: "table",
  bucket: "",
  accountId: "",
  endpoint: "",
  accessKeyId: "",
  secretAccessKey: "",
  sessionToken: "",
  region: "auto",
};

const SAVED_CONNECTIONS_KEY = "vector-watcher:saved-connections";

type SavedConnection = Omit<LanceConnectionState, "accessKeyId" | "secretAccessKey" | "sessionToken">;

const getSavedConnections = (): SavedConnection[] => {
  try {
    const stored = localStorage.getItem(SAVED_CONNECTIONS_KEY);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
};

const saveSavedConnections = (connections: SavedConnection[]) => {
  localStorage.setItem(SAVED_CONNECTIONS_KEY, JSON.stringify(connections));
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("connection");
  const [connection, setConnection] = useState<LanceConnectionState>(EMPTY_CONNECTION);
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>(() => getSavedConnections());
  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState<LanceTableItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [details, setDetails] = useState<LanceTableDetails | null>(null);
  const [rows, setRows] = useState<LanceRowSummary[]>([]);
  const [query, setQuery] = useState<ExplorerQueryState>(DEFAULT_EXPLORER_QUERY);
  const [pagination, setPagination] = useState<LancePagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [vectorRow, setVectorRow] = useState<LanceRowSummary | null>(null);
  const [vectorDetail, setVectorDetail] = useState<LanceRowDetail | null>(null);
  const [vectorLoading, setVectorLoading] = useState(false);
  const [vectorError, setVectorError] = useState<string | null>(null);
  const [vectorTrigger, setVectorTrigger] = useState<HTMLButtonElement | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const source: LanceDataSource = useMemo(
    () => ({
      name: connection.name,
      storage: connection.storage,
      path: connection.path,
      bucket: connection.bucket,
      endpoint: connection.endpoint,
      access_key_id: connection.accessKeyId,
      secret_access_key: connection.secretAccessKey,
      session_token: connection.sessionToken,
      region: connection.region,
    }),
    [connection],
  );

  const loadRows = useCallback(
    async (nextQuery: ExplorerQueryState = query, table = selectedTable) => {
      if (!connected || !table) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getRows(connection, table, {
          page: nextQuery.page,
          pageSize: nextQuery.pageSize,
          search: nextQuery.search,
          tag: nextQuery.tag,
          sortBy: nextQuery.sortBy,
          sortOrder: nextQuery.sortOrder,
        });
        setRows(response.rows);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load rows.");
      } finally {
        setLoading(false);
      }
    },
    [connected, connection, query, selectedTable],
  );

  const loadTable = useCallback(
    async (table: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await getTableDetails(connection, table);
        setDetails(response);
        setSelectedTable(table);
        const resetQuery = DEFAULT_EXPLORER_QUERY;
        setQuery(resetQuery);
        const rowsResponse = await getRows(connection, table, {
          page: resetQuery.page,
          pageSize: resetQuery.pageSize,
          search: resetQuery.search,
          tag: resetQuery.tag,
          sortBy: resetQuery.sortBy,
          sortOrder: resetQuery.sortOrder,
        });
        setRows(rowsResponse.rows);
        setPagination(rowsResponse.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load table.");
      } finally {
        setLoading(false);
      }
    },
    [connection],
  );

  const scan = useCallback(
    async (goToExplorer = true) => {
      setLoading(true);
      setError(null);
      try {
        const response = await scanConnection(connection);
        setTables(response.tables);
        setConnected(true);
        const firstTable = response.tables[0]?.name ?? null;
        setSelectedTable(firstTable);
        if (firstTable) {
          await loadTable(firstTable);
        } else {
          setDetails(null);
          setRows([]);
        }
        if (goToExplorer) {
          setActiveTab(firstTable ? "explorer" : "database");
        }
      } catch (err) {
        setConnected(false);
        setError(err instanceof Error ? err.message : "Unable to connect.");
      } finally {
        setLoading(false);
      }
    },
    [connection, loadTable],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await scanConnection(connection);
      setTables(response.tables);
      const currentExists = response.tables.some((table) => table.name === selectedTable);
      const nextTable = currentExists ? selectedTable : (response.tables[0]?.name ?? null);
      setSelectedTable(nextTable);
      if (nextTable) {
        await loadTable(nextTable);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh.");
    } finally {
      setRefreshing(false);
    }
  }, [connection, loadTable, selectedTable]);

  const handleSelectTable = useCallback(
    async (table: string) => {
      await loadTable(table);
    },
    [loadTable],
  );

  const handleTagApply = useCallback(
    (tag: string) => {
      const next = {
        ...query,
        tag,
        page: 1,
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query],
  );

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (search: string) => {
      const next = {
        ...query,
        search,
        page: 1,
      };

      setQuery(next);
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      searchTimerRef.current = setTimeout(() => {
        void loadRows(next);
      }, 400);
    },
    [loadRows, query],
  );

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleSortChange = useCallback(
    (sortBy: ExplorerQueryState["sortBy"], sortOrder: ExplorerQueryState["sortOrder"]) => {
      const next = {
        ...query,
        sortBy,
        sortOrder,
        page: 1,
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query],
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const next = {
        ...query,
        pageSize,
        page: 1,
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const next = {
        ...query,
        page,
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query],
  );

  const handleCopy = useCallback(async (value: string, message: string) => {
    try {
      await writeTextToClipboard(value);
      setCopyMessage(message);
      window.setTimeout(() => {
        setCopyMessage(null);
      }, 1800);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to copy.");
    }
  }, []);

  const handleViewVector = useCallback(
    async (row: LanceRowSummary, trigger: HTMLButtonElement) => {
      if (!selectedTable) return;

      setVectorRow(row);
      setVectorDetail(null);
      setVectorError(null);
      setVectorTrigger(trigger);
      setVectorLoading(true);

      try {
        const detail = await getRow(connection, selectedTable, row.row_id);

        setVectorDetail(detail);
      } catch (err) {
        setVectorError(err instanceof Error ? err.message : "Unable to load vector.");
      } finally {
        setVectorLoading(false);
      }
    },
    [connection, selectedTable],
  );

  const handleLock = () => {
    setLocked(true);
  };

  const handleUnlock = () => {
    setLocked(false);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setTables([]);
    setSelectedTable(null);
    setDetails(null);
    setRows([]);
    setPagination(null);
    setActiveTab("connection");
  };

  useEffect(() => {
    if (!connected) {
      setActiveTab("connection");
    }
  }, [connected]);

  const handleSaveConnection = useCallback(() => {
    const savedConnection: SavedConnection = {
      name: connection.name.trim(),
      storage: connection.storage,
      path: connection.path,
      bucket: connection.bucket,
      endpoint: connection.endpoint,
      accountId: connection.accountId,
      region: connection.region,
    };

    if (!savedConnection.name) {
      return;
    }

    const nextConnections = [...savedConnections.filter((item) => item.name !== savedConnection.name), savedConnection];

    setSavedConnections(nextConnections);
    saveSavedConnections(nextConnections);
  }, [connection, savedConnections]);

  const handleLoadConnection = useCallback(
    (name: string) => {
      const saved = savedConnections.find((item) => item.name === name);

      if (!saved) {
        return;
      }

      setConnection({
        ...saved,
        accessKeyId: "",
        secretAccessKey: "",
        sessionToken: "",
      });
    },
    [savedConnections],
  );

  const handleDeleteConnection = useCallback(
    (name: string) => {
      const nextConnections = savedConnections.filter((item) => item.name !== name);

      setSavedConnections(nextConnections);
      saveSavedConnections(nextConnections);
    },
    [savedConnections],
  );

  if (locked) {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <div className="brand-mark">◈</div>
          <span className="eyebrow">Vector Watcher</span>
          <h1>Explorer locked</h1>
          <p>Your session is still connected, but the explorer is hidden.</p>
          <button type="button" className="button button-primary" onClick={handleUnlock}>
            Unlock explorer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">◈</div>
          <div>
            <strong>Vector Watcher</strong>
            <span>LanceDB explorer</span>
          </div>
        </div>

        <div className="header-status">
          <span className={`status-dot ${connected ? "is-connected" : ""}`} />
          {connected ? connection.name : "No connection"}
        </div>
      </header>

      <nav className="app-tabs">
        <button type="button" className={activeTab === "connection" ? "active" : ""} onClick={() => setActiveTab("connection")}>
          <span>01</span>
          Connection
        </button>

        <button
          type="button"
          className={activeTab === "database" ? "active" : ""}
          onClick={() => connected && setActiveTab("database")}
          disabled={!connected}
        >
          <span>02</span>
          Database
        </button>

        <button
          type="button"
          className={activeTab === "explorer" ? "active" : ""}
          onClick={() => connected && setActiveTab("explorer")}
          disabled={!connected}
        >
          <span>03</span>
          Explorer
        </button>
      </nav>

      <main className="app-content">
        {copyMessage && (
          <div className="copy-toast" role="status" aria-live="polite">
            <span className="copy-toast__icon">✓</span>
            {copyMessage}
          </div>
        )}
        {activeTab === "connection" && (
          <ConnectionTab
            connection={connection}
            loading={loading}
            error={error}
            connected={connected}
            savedConnections={savedConnections}
            onChange={setConnection}
            onConnect={() => void scan()}
            onDisconnect={handleDisconnect}
            onSaveConnection={handleSaveConnection}
            onLoadConnection={handleLoadConnection}
            onDeleteConnection={handleDeleteConnection}
          />
        )}

        {activeTab === "database" && connected && (
          <DatabaseTab
            tables={tables}
            selectedTable={selectedTable}
            details={details}
            loading={loading}
            onSelectTable={handleSelectTable}
            onRefresh={() => void refresh()}
          />
        )}

        {activeTab === "explorer" && connected && (
          <ExplorerTab
            source={source}
            tables={tables}
            selectedTable={selectedTable}
            details={details}
            rows={rows}
            pagination={pagination}
            query={query}
            search={query.search}
            onSearchChange={handleSearchChange}
            loading={loading}
            refreshing={refreshing}
            vectorRow={vectorRow}
            vectorDetail={vectorDetail}
            vectorLoading={vectorLoading}
            vectorError={vectorError}
            vectorTrigger={vectorTrigger}
            onSelectTable={handleSelectTable}
            onRefresh={() => void refresh()}
            onChangeSource={() => setActiveTab("connection")}
            onLock={handleLock}
            onTagApply={handleTagApply}
            onSortChange={handleSortChange}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={handlePageChange}
            onCopy={handleCopy}
            onViewVector={handleViewVector}
            onClearFilter={() => handleTagApply("")}
            onCloseVector={() => {
              setVectorRow(null);
              setVectorDetail(null);
            }}
            onRetryVector={() => {
              if (vectorRow) {
                void handleViewVector(vectorRow, vectorTrigger!);
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
