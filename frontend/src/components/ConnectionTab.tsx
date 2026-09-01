import { LANCE_STORAGE, type LanceConnectionState, type LanceStorageType } from "@/api/lancedbAdmin";
import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useState } from "react";

import "@/assets/styles/connection.css";

type SavedConnection = Omit<LanceConnectionState, "accessKeyId" | "secretAccessKey" | "sessionToken">;

interface ConnectionTabProps {
  connection: LanceConnectionState;
  loading: boolean;
  error: string | null;
  connected: boolean;
  savedConnections: SavedConnection[];
  selectedConnectionName: string | null;
  onChange: (connection: LanceConnectionState) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSaveConnection: () => void;
  onLoadConnection: (name: string) => void;
  onDeleteConnection: (name: string) => void;
  onNewConnection: () => void;
}

const STORAGE_LABELS: Record<LanceStorageType, string> = {
  [LANCE_STORAGE.R2]: "Cloudflare R2",
  [LANCE_STORAGE.S3]: "Amazon S3",
  [LANCE_STORAGE.LOCAL]: "Local LanceDB"
};

function maskCredential(value: string): string {
  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return "•".repeat(value.length);
  }

  return `${value.slice(0, 4)}${"•".repeat(value.length - 8)}${value.slice(-4)}`;
}

export default function ConnectionTab({
  connection,
  loading,
  error,
  connected,
  savedConnections,
  onChange,
  onConnect,
  onDisconnect,
  onSaveConnection,
  onLoadConnection,
  onDeleteConnection,
  onNewConnection,
  selectedConnectionName
}: ConnectionTabProps) {
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    if (!showSecretKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSecretKey(false);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showSecretKey]);

  const storageLabel = STORAGE_LABELS[connection.storage];

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    update({
      path: event.target.value
    });
  };

  const canConnect = useMemo(() => {
    if (connection.storage === LANCE_STORAGE.LOCAL) {
      return Boolean(connection.path.trim()) && Boolean(connection.name.trim());
    }

    if (!connection.name.trim()) {
      return false;
    }

    if (!connection.bucket.trim()) {
      return false;
    }

    if (!connection.accessKeyId.trim()) {
      return false;
    }

    if (!connection.secretAccessKey.trim()) {
      return false;
    }

    if (connection.storage === LANCE_STORAGE.R2) {
      return Boolean(connection.accountId.trim());
    }

    return Boolean(connection.region.trim());
  }, [connection]);

  const canSave = Boolean(connection.name.trim());

  const update = (patch: Partial<LanceConnectionState>) => {
    onChange({
      ...connection,
      ...patch
    });
  };

  const handleBrowseLocal = async () => {
    if (!isTauri()) {
      return;
    }
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select LanceDB database"
    });

    if (typeof selected === "string") {
      update({
        path: selected
      });
    }
  };

  const handleDeleteConnection = () => {
    const name = connection.name.trim();

    if (!name) {
      return;
    }

    onDeleteConnection(name);
  };

  const onStorageChange = (event: import("react").ChangeEvent<HTMLSelectElement, HTMLSelectElement>): void => {
    const storage = event.target.value as LanceStorageType;

    if (storage === LANCE_STORAGE.R2) {
      update({
        storage,
        endpoint: "",
        region: "auto",
        accountId: ""
      });

      return;
    }

    if (storage === LANCE_STORAGE.S3) {
      update({
        storage,
        accountId: "",
        region: ""
      });

      return;
    }

    update({
      storage,
      bucket: "",
      accountId: "",
      endpoint: "",
      accessKeyId: "",
      secretAccessKey: "",
      sessionToken: "",
      region: ""
    });
  };
  return (
    <div className="connection-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Connection</span>
          <h1>Connect to LanceDB</h1>
          <p>Configure a storage source and open a LanceDB database.</p>
        </div>

        <div className={`connection-status ${connected ? "is-connected" : ""}`}>
          <span />
          {connected ? "Connected" : "Not connected"}
        </div>
      </div>

      <div className="connection-layout">
        <section className="surface connection-form-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Source</span>
              <h2>Connection details</h2>
            </div>
          </div>

          <div className="form-grid">
            {savedConnections.length > 0 && (
              <div className="field field-full">
                <span>Saved connection</span>

                <div className="field-with-action">
                  <select
                    className="connection-select"
                    value={selectedConnectionName ?? ""}
                    onChange={(event) => {
                      const name = event.currentTarget.value;
                      if (!name) {
                        return;
                      }
                      void onLoadConnection(name);
                      event.currentTarget.value = "";
                    }}
                    disabled={loading}
                  >
                    <option value="">Select saved connection</option>

                    {savedConnections.map((saved) => (
                      <option key={saved.name} value={saved.name}>
                        {saved.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={onNewConnection}
                    disabled={loading}
                  >
                    New
                  </button>
                </div>
              </div>
            )}
            <label className="field field-full">
              <span>Storage provider</span>

              <select
                value={connection.storage}
                onChange={onStorageChange}
                disabled={loading}
                className="connection-select"
              >
                <option value={LANCE_STORAGE.R2}>Cloudflare R2</option>
                <option value={LANCE_STORAGE.S3}>Amazon S3</option>
                <option value={LANCE_STORAGE.LOCAL}>Local LanceDB</option>
              </select>
            </label>

            <label className="field field-full">
              <span>Connection name</span>

              <div className="field-with-action">
                <input
                  value={connection.name}
                  onChange={(event) =>
                    update({
                      name: event.target.value
                    })
                  }
                  placeholder="e.g. Threadzip R2"
                  maxLength={128}
                  autoComplete="off"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={onSaveConnection}
                  disabled={loading || !canSave}
                >
                  {selectedConnectionName ? "Update Connection" : "Save Connection"}
                </button>

                {savedConnections.some((saved) => saved.name === connection.name.trim()) && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={handleDeleteConnection}
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
              </div>
            </label>

            {connection.storage !== LANCE_STORAGE.LOCAL && (
              <>
                <label className="field field-full">
                  <span>Database path</span>

                  <input
                    value={connection.path}
                    onChange={(event) =>
                      update({
                        path: event.target.value
                      })
                    }
                    placeholder="table"
                    disabled={loading}
                  />

                  <small>
                    Example: <code>table</code>
                  </small>
                </label>

                <label className="field">
                  <span>Bucket</span>

                  <input
                    value={connection.bucket}
                    onChange={(event) =>
                      update({
                        bucket: event.target.value
                      })
                    }
                    placeholder="your-bucket-name"
                    disabled={loading}
                  />
                </label>

                <label className="field">
                  <span>Region</span>

                  <input
                    value={connection.region}
                    onChange={(event) =>
                      update({
                        region: event.target.value
                      })
                    }
                    placeholder={connection.storage === LANCE_STORAGE.R2 ? "auto" : "ap-south-1"}
                    disabled={loading}
                  />
                </label>

                {connection.storage === LANCE_STORAGE.R2 ? (
                  <label className="field field-full">
                    <span>Cloudflare Account ID</span>

                    <input
                      value={connection.accountId}
                      onChange={(event) =>
                        update({
                          accountId: event.target.value
                        })
                      }
                      placeholder="Your Cloudflare Account ID"
                      disabled={loading}
                      autoComplete="off"
                      spellCheck={false}
                    />

                    <small>
                      Endpoint:{" "}
                      <code>
                        https://
                        {connection.accountId.trim() || "<account-id>"}
                        .r2.cloudflarestorage.com
                      </code>
                    </small>
                  </label>
                ) : (
                  <label className="field field-full">
                    <span>S3 endpoint (Optional)</span>

                    <input
                      value={connection.endpoint}
                      onChange={(event) =>
                        update({
                          endpoint: event.target.value
                        })
                      }
                      placeholder="https://s3.amazonaws.com"
                      disabled={loading}
                    />
                  </label>
                )}

                <label className="field">
                  <span>Access Key ID</span>

                  <div className="secret-input">
                    <input
                      type="text"
                      value={connection.accessKeyId}
                      onChange={(event) =>
                        update({
                          accessKeyId: event.target.value
                        })
                      }
                      autoComplete="off"
                      disabled={loading}
                      className={!showAccessKey ? "credential-hidden" : ""}
                    />

                    {!showAccessKey && connection.accessKeyId && (
                      <span className="credential-mask" aria-hidden="true">
                        {maskCredential(connection.accessKeyId)}
                      </span>
                    )}

                    <button type="button" onClick={() => setShowAccessKey((value) => !value)} disabled={loading}>
                      {showAccessKey ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>Secret Access Key</span>

                  <div className="secret-input">
                    <input
                      type="text"
                      value={connection.secretAccessKey}
                      onChange={(event) =>
                        update({
                          secretAccessKey: event.target.value
                        })
                      }
                      autoComplete="off"
                      disabled={loading}
                      className={!showSecretKey ? "credential-hidden" : ""}
                    />

                    {!showSecretKey && connection.secretAccessKey && (
                      <span className="credential-mask" aria-hidden="true">
                        {maskCredential(connection.secretAccessKey)}
                      </span>
                    )}

                    <button type="button" onClick={() => setShowSecretKey((value) => !value)} disabled={loading}>
                      {showSecretKey ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                {connection.storage === LANCE_STORAGE.S3 && (
                  <label className="field field-full">
                    <span>Session token (Optional)</span>

                    <input
                      type="password"
                      value={connection.sessionToken}
                      placeholder="Used only with temporary S3 credentials."
                      onChange={(event) =>
                        update({
                          sessionToken: event.target.value
                        })
                      }
                      autoComplete="off"
                      disabled={loading}
                    />
                  </label>
                )}
              </>
            )}

            {connection.storage === LANCE_STORAGE.LOCAL && (
              <label className="field field-full">
                <span>Local LanceDB database</span>

                <div className="field-with-action">
                  <input
                    value={connection.path}
                    placeholder="Select a LanceDB database folder"
                    readOnly={isTauri()}
                    disabled={loading}
                    onChange={handlePathChange}
                  />

                  <button
                    type="button"
                    onClick={() => void handleBrowseLocal()}
                    disabled={loading || !isTauri()}
                    title={!isTauri() ? "Folder browsing is available in the desktop application" : undefined}
                  >
                    Browse
                  </button>
                </div>

                <small>Select the folder containing the LanceDB database.</small>
              </label>
            )}
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-actions">
            {connected && (
              <button type="button" className="button button-secondary" onClick={onDisconnect} disabled={loading}>
                Disconnect
              </button>
            )}

            <button
              type="button"
              className="button button-primary"
              onClick={onConnect}
              disabled={!canConnect || loading}
            >
              {loading ? "Connecting…" : connected ? "Reconnect" : "Connect"}
            </button>
          </div>
        </section>

        <aside className="connection-side">
          <div className="surface info-card">
            <span className="eyebrow">Selected provider</span>
            <strong>{storageLabel}</strong>

            <p>
              {connection.storage === LANCE_STORAGE.R2
                ? "Uses the S3-compatible Cloudflare R2 API."
                : connection.storage === LANCE_STORAGE.S3
                  ? "Connects directly to an Amazon S3-compatible LanceDB location."
                  : "Uses a LanceDB database available to the backend."}
            </p>
          </div>

          <div className="surface security-card">
            <span className="eyebrow">Security</span>
            <h3>Credentials are securely stored</h3>
            <p>
              Storage credentials are stored separately from connection settings and protected by your credential vault
              password.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
