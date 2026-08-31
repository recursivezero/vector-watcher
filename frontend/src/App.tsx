import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  LanceConnectionState,
  LanceDataSource,
  LancePagination,
  LanceRowDetail,
  LanceRowSummary,
  LanceTableDetails,
  LanceTableItem
} from "@/api/lancedbAdmin";

import { getRow, getRows, getTableDetails, scanConnection } from "@/api/lancedbAdmin";

import ConnectionTab from "@/components/ConnectionTab";
import DatabaseTab from "@/components/DatabaseTab";
import ExplorerTab from "@/components/ExplorerTab";

import {
  deleteCredentials,
  isCredentialVaultInitialized,
  loadCredentials,
  saveCredentials,
  unlockCredentials
} from "@/lib/credentials";
import {
  DEFAULT_EXPLORER_QUERY,
  type ExplorerQueryState,
  getErrorMessage,
  writeTextToClipboard
} from "@/lib/explorerUtils";
import { isTauri } from "@tauri-apps/api/core";
import { ThemeToggle } from "./components/ThemeToggle";

type AppTab = "connection" | "database" | "explorer";

const isDesktopApp = isTauri();

const EMPTY_CONNECTION: LanceConnectionState = {
  name: "",
  storage: "r2",
  path: "table",
  bucket: "",
  accountId: "",
  endpoint: "",
  accessKeyId: "",
  secretAccessKey: "",
  sessionToken: "",
  region: "auto"
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

type CredentialAction =
  | {
      type: "save";
    }
  | {
      type: "load";
      name: string;
    }
  | {
      type: "delete";
      name: string;
    };

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("connection");
  const [connection, setConnection] = useState<LanceConnectionState>(EMPTY_CONNECTION);
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>(() => getSavedConnections());
  const [selectedConnectionName, setSelectedConnectionName] = useState<string | null>(null);
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
  const [credentialUnlocking, setCredentialUnlocking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [credentialsUnlocked, setCredentialsUnlocked] = useState(false);
  const [credentialPassword, setCredentialPassword] = useState("");
  const [credentialPasswordConfirm, setCredentialPasswordConfirm] = useState("");
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [credentialModalError, setCredentialModalError] = useState<string | null>(null);
  const [pendingCredentialAction, setPendingCredentialAction] = useState<CredentialAction | null>(null);

  const source: LanceDataSource = useMemo(
    () => ({
      name: connection.name,
      account_id: connection.accountId,
      storage: connection.storage,
      path: connection.path,
      bucket: connection.bucket,
      endpoint: connection.endpoint,
      access_key_id: connection.accessKeyId,
      secret_access_key: connection.secretAccessKey,
      session_token: connection.sessionToken,
      region: connection.region
    }),
    [connection]
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
          sortOrder: nextQuery.sortOrder
        });
        setRows(response.rows);
        setPagination(response.pagination);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [connected, connection, query, selectedTable]
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
          sortOrder: resetQuery.sortOrder
        });
        setRows(rowsResponse.rows);
        setPagination(rowsResponse.pagination);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [connection]
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
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [connection, loadTable]
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
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, [connection, loadTable, selectedTable]);

  const handleSelectTable = useCallback(
    async (table: string) => {
      await loadTable(table);
    },
    [loadTable]
  );

  const handleTagApply = useCallback(
    (tag: string) => {
      const next = {
        ...query,
        tag,
        page: 1
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query]
  );

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (search: string) => {
      const next = {
        ...query,
        search,
        page: 1
      };

      setQuery(next);
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      searchTimerRef.current = setTimeout(() => {
        void loadRows(next);
      }, 400);
    },
    [loadRows, query]
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
        page: 1
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const next = {
        ...query,
        pageSize,
        page: 1
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const next = {
        ...query,
        page
      };

      setQuery(next);
      void loadRows(next);
    },
    [loadRows, query]
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
      setError(getErrorMessage(err));
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
    [connection, selectedTable]
  );

  const handleLock = () => {
    setLocked(true);
  };

  const handleUnlock = () => {
    setLocked(false);
  };

  const handleDisconnect = () => {
    setConnection(EMPTY_CONNECTION);
    setSelectedConnectionName(null);
    setConnected(false);
    setTables([]);
    setSelectedTable(null);
    setDetails(null);
    setRows([]);
    setPagination(null);
    setActiveTab("connection");
  };

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const handleNewConnection = useCallback(() => {
    setConnection(EMPTY_CONNECTION);
    setSelectedConnectionName(null);
    setError(null);
  }, []);

  const runCredentialAction = useCallback(
    async (action: CredentialAction) => {
      if (action.type === "save") {
        const connectionName = connection.name.trim();

        if (!connectionName) {
          throw new Error("Enter a connection name.");
        }

        const previousConnectionName = selectedConnectionName;
        const isUpdate = previousConnectionName !== null;

        const existingConnectionWithSameName = savedConnections.some(
          (item) => item.name === connectionName && item.name !== previousConnectionName
        );

        if (existingConnectionWithSameName) {
          throw new Error(`A saved connection named "${connectionName}" already exists.`);
        }

        await saveCredentials(connectionName, {
          accessKeyId: connection.accessKeyId,
          secretAccessKey: connection.secretAccessKey,
          sessionToken: connection.sessionToken
        });

        if (previousConnectionName && previousConnectionName !== connectionName) {
          await deleteCredentials(previousConnectionName);
        }

        const savedConnection: SavedConnection = {
          name: connectionName,
          storage: connection.storage,
          path: connection.path,
          bucket: connection.bucket,
          endpoint: connection.endpoint,
          accountId: connection.accountId,
          region: connection.region
        };

        const nextConnections = isUpdate
          ? savedConnections.map((item) => (item.name === previousConnectionName ? savedConnection : item))
          : [...savedConnections, savedConnection];

        saveSavedConnections(nextConnections);

        setSavedConnections(nextConnections);
        setSelectedConnectionName(connectionName);

        return isUpdate ? "updated" : "saved";
      }

      if (action.type === "load") {
        const saved = savedConnections.find((item) => item.name === action.name);

        if (!saved) {
          return;
        }

        const credentials = await loadCredentials(saved.name);

        if (!credentials) {
          throw new Error(`No credentials were saved for "${saved.name}".`);
        }

        setConnection({
          ...saved,
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        });
        setSelectedConnectionName(saved.name);

        return;
      }

      await deleteCredentials(action.name);

      const nextConnections = savedConnections.filter((item) => item.name !== action.name);

      setSavedConnections(nextConnections);
      saveSavedConnections(nextConnections);
    },
    [connection, savedConnections, selectedConnectionName]
  );

  const handleSaveConnection = useCallback(async () => {
    const name = connection.name.trim();

    if (!name) {
      return;
    }

    if (connection.storage !== "local") {
      if (!connection.accessKeyId.trim()) {
        setError("Enter an Access Key ID.");
        return;
      }

      if (!connection.secretAccessKey.trim()) {
        setError("Enter a Secret Access Key.");
        return;
      }
    }

    if (!isCredentialVaultInitialized() || !credentialsUnlocked) {
      setPendingCredentialAction({
        type: "save"
      });

      setCredentialPassword("");
      setCredentialPasswordConfirm("");
      setCredentialModalError(null);
      setCredentialModalOpen(true);

      return;
    }

    try {
      const result = await runCredentialAction({
        type: "save"
      });

      setError(null);
      showToast(`Connection ${result === "updated" ? "updated" : "saved"} successfully`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [
    connection.accessKeyId,
    connection.name,
    connection.secretAccessKey,
    connection.storage,
    credentialsUnlocked,
    runCredentialAction,
    showToast
  ]);

  const handleLoadConnection = useCallback(
    async (name: string) => {
      const saved = savedConnections.find((item) => item.name === name);

      if (!saved) {
        return;
      }

      if (!isCredentialVaultInitialized()) {
        setConnection({
          ...saved,
          accessKeyId: "",
          secretAccessKey: "",
          sessionToken: ""
        });

        setError(
          "Enter the credentials for this connection, then click Save Connection to create the secure credential vault."
        );

        return;
      }

      if (!credentialsUnlocked) {
        setPendingCredentialAction({
          type: "load",
          name
        });

        setCredentialPassword("");
        setCredentialPasswordConfirm("");
        setCredentialModalError(null);
        setCredentialModalOpen(true);

        return;
      }

      try {
        await runCredentialAction({
          type: "load",
          name
        });

        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [credentialsUnlocked, runCredentialAction, savedConnections]
  );

  const handleDeleteConnection = useCallback(
    async (name: string) => {
      const saved = savedConnections.find((item) => item.name === name);

      if (!saved) {
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete the saved connection "${name}"?\n\nThis action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      if (!isCredentialVaultInitialized()) {
        const nextConnections = savedConnections.filter((item) => item.name !== name);

        setSavedConnections(nextConnections);
        saveSavedConnections(nextConnections);

        if (connection.name === name) {
          setConnection(EMPTY_CONNECTION);
        }

        showToast(`Connection "${name}" deleted successfully.`);

        setError(null);

        return;
      }

      if (!credentialsUnlocked) {
        setPendingCredentialAction({
          type: "delete",
          name
        });

        setCredentialPassword("");
        setCredentialPasswordConfirm("");
        setCredentialModalError(null);
        setCredentialModalOpen(true);

        return;
      }

      try {
        await runCredentialAction({
          type: "delete",
          name
        });

        if (connection.name === name) {
          setConnection(EMPTY_CONNECTION);
        }

        showToast(`Connection "${name}" deleted successfully.`);

        window.setTimeout(() => {
          setCopyMessage(null);
        }, 1800);

        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [connection.name, credentialsUnlocked, runCredentialAction, savedConnections, showToast]
  );

  const handleCredentialUnlock = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (credentialUnlocking) {
        return;
      }

      if (!credentialPassword) {
        setCredentialModalError("Enter a master password.");
        return;
      }

      if (!isCredentialVaultInitialized() && credentialPassword !== credentialPasswordConfirm) {
        setCredentialModalError("The passwords do not match.");
        return;
      }

      try {
        setCredentialUnlocking(true);
        setCredentialModalError(null);

        await unlockCredentials(credentialPassword);

        const action = pendingCredentialAction;

        if (action) {
          await runCredentialAction(action);
        }

        setCredentialsUnlocked(true);
        setPendingCredentialAction(null);
        setCredentialPassword("");
        setCredentialPasswordConfirm("");
        setCredentialModalOpen(false);
        setError(null);
      } catch (err) {
        console.error("Credential vault error:", err);

        const message = err instanceof Error ? err.message : String(err);

        if (message.includes("BadFileKey") || message.includes("failed to decode/decrypt")) {
          setCredentialModalError("Incorrect master password. Please try again.");
        } else {
          setCredentialModalError("Unable to unlock the credential vault. Please try again.");
        }
      } finally {
        setCredentialUnlocking(false);
      }
    },
    [credentialPassword, credentialPasswordConfirm, credentialUnlocking, pendingCredentialAction, runCredentialAction]
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
      {credentialModalOpen && (
        <div className="credential-modal-backdrop">
          <div className="credential-modal" role="dialog" aria-modal="true" aria-labelledby="credential-modal-title">
            <div className="credential-modal__header">
              <span className="eyebrow">Secure credentials</span>

              <h2 id="credential-modal-title">
                {!isCredentialVaultInitialized() ? "Create credential vault" : "Unlock credential vault"}
              </h2>

              <p>
                {!isCredentialVaultInitialized()
                  ? "Create a master password to protect your saved connection credentials."
                  : "Enter your master password to access saved connection credentials."}
              </p>
            </div>

            <form onSubmit={handleCredentialUnlock}>
              <label className="field">
                <span>Master password</span>

                <input
                  type="password"
                  value={credentialPassword}
                  onChange={(event) => setCredentialPassword(event.target.value)}
                  autoFocus
                  autoComplete="new-password"
                  disabled={loading}
                />
              </label>

              {!isCredentialVaultInitialized() && (
                <label className="field">
                  <span>Confirm password</span>

                  <input
                    type="password"
                    value={credentialPasswordConfirm}
                    onChange={(event) => setCredentialPasswordConfirm(event.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </label>
              )}

              {credentialModalError && <p className="credential-modal__error">{credentialModalError}</p>}

              <div className="credential-modal__actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setCredentialModalOpen(false);
                    setCredentialPassword("");
                    setCredentialPasswordConfirm("");
                    setPendingCredentialAction(null);
                    setCredentialModalError(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={credentialUnlocking || !isDesktopApp}
                  title={
                    !isDesktopApp
                      ? "Credential storage is only available in the Vector Watcher desktop application."
                      : undefined
                  }
                >
                  {credentialUnlocking ? "Unlocking..." : isCredentialVaultInitialized() ? "Unlock" : "Create vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
        <ThemeToggle />
      </header>

      <nav className="app-tabs">
        <button
          type="button"
          className={activeTab === "connection" ? "active" : ""}
          onClick={() => setActiveTab("connection")}
        >
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
            selectedConnectionName={selectedConnectionName}
            onDisconnect={handleDisconnect}
            onSaveConnection={handleSaveConnection}
            onLoadConnection={handleLoadConnection}
            onDeleteConnection={handleDeleteConnection}
            onNewConnection={handleNewConnection}
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
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Recursive Zero</span>

        <span className="app-footer__separator">·</span>

        <span>Vector Watcher v1.1.0</span>

        <span className="app-footer__separator">·</span>

        <span>MIT License</span>

        <span className="app-footer__separator">·</span>

        <a
          href="https://github.com/recursivezero/vector-watcher"
          target="_blank"
          rel="noopener noreferrer"
          className="app-footer__github"
          aria-label="View Vector Watcher on GitHub"
          title="View source code on GitHub"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-1.026-.013-1.862-2.782.604-3.369-1.18-3.369-1.18-.455-1.156-1.11-1.464-1.11-1.464-.908-.621.069-.608.069-.608 1.004.07 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.221-.253-4.556-1.111-4.556-4.943 0-1.092.39-1.985 1.029-2.685-.103-.253-.446-1.271.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.756a9.59 9.59 0 0 1 2.504.337c1.909-1.295 2.748-1.026 2.748-1.026.546 1.379.203 2.397.1 2.65.64.7 1.028 1.593 1.028 2.685 0 3.841-2.339 4.687-4.566 4.935.359.31.678.919.678 1.852 0 1.337-.012 2.415-.012 2.744 0 .267.18.578.688.48A10.001 10.001 0 0 0 22 12c0-5.523-4.477-10-10-10Z" />
          </svg>

          <span>GitHub</span>
        </a>
      </footer>

      {toastMessage && (
        <div className="copy-toast" role="status">
          <span className="copy-toast__icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
