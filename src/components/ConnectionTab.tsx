import { LANCE_STORAGE, type LanceConnectionState, type LanceStorageType } from "@/api/lancedbAdmin";
import { open } from "@tauri-apps/plugin-dialog";
import { useMemo, useState } from "react";

interface ConnectionTabProps {
  connection: LanceConnectionState;
  loading: boolean;
  error: string | null;
  connected: boolean;
  onChange: (connection: LanceConnectionState) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

const STORAGE_LABELS: Record<LanceStorageType, string> = {
  [LANCE_STORAGE.R2]: "Cloudflare R2",
  [LANCE_STORAGE.S3]: "Amazon S3",
  [LANCE_STORAGE.LOCAL]: "Local LanceDB",
};

export default function ConnectionTab({ connection, loading, error, connected, onChange, onConnect, onDisconnect }: ConnectionTabProps) {
  const [showSecret, setShowSecret] = useState(false);

  const storageLabel = STORAGE_LABELS[connection.storage];

  const canConnect = useMemo(() => {
    if (connection.storage === LANCE_STORAGE.LOCAL) {
      return Boolean(connection.path.trim());
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

  const update = (patch: Partial<LanceConnectionState>) => {
    onChange({
      ...connection,
      ...patch,
    });
  };

  const handleBrowseLocal = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select LanceDB database",
    });

    if (typeof selected === "string") {
      update({
        path: selected,
      });
    }
  };

  return (
    <div className="connection-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Connection</span>
          <h1>Connect to LanceDB</h1>
          <p>Configure a storage source and open a LanceDB database. Credentials stay in application memory.</p>
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
            <label className="field field-full">
              <span>Storage provider</span>

              <select
                value={connection.storage}
                onChange={(event) =>
                  update({
                    storage: event.target.value as LanceStorageType,
                  })
                }
                disabled={loading}
              >
                <option value={LANCE_STORAGE.R2}>Cloudflare R2</option>
                <option value={LANCE_STORAGE.S3}>Amazon S3</option>
                <option value={LANCE_STORAGE.LOCAL}>Local LanceDB</option>
              </select>
            </label>

            {connection.storage !== LANCE_STORAGE.LOCAL && (
              <>
                <label className="field field-full">
                  <span>Database path</span>

                  <input
                    value={connection.path}
                    onChange={(event) =>
                      update({
                        path: event.target.value,
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
                        bucket: event.target.value,
                      })
                    }
                    placeholder="threadzip-bucket"
                    disabled={loading}
                  />
                </label>

                <label className="field">
                  <span>Region</span>

                  <input
                    value={connection.region}
                    onChange={(event) =>
                      update({
                        region: event.target.value,
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
                          accountId: event.target.value,
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
                    <span>S3 endpoint (optional)</span>

                    <input
                      value={connection.endpoint}
                      onChange={(event) =>
                        update({
                          endpoint: event.target.value,
                        })
                      }
                      placeholder="https://s3.amazonaws.com"
                      disabled={loading}
                    />
                  </label>
                )}

                <label className="field">
                  <span>Access Key ID</span>

                  <input
                    value={connection.accessKeyId}
                    onChange={(event) =>
                      update({
                        accessKeyId: event.target.value,
                      })
                    }
                    autoComplete="off"
                    disabled={loading}
                  />
                </label>

                <label className="field">
                  <span>Secret Access Key</span>

                  <div className="secret-input">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={connection.secretAccessKey}
                      onChange={(event) =>
                        update({
                          secretAccessKey: event.target.value,
                        })
                      }
                      autoComplete="off"
                      disabled={loading}
                    />

                    <button type="button" onClick={() => setShowSecret((value) => !value)} disabled={loading}>
                      {showSecret ? "Hide" : "Show"}
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
                          sessionToken: event.target.value,
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
                  <input value={connection.path} readOnly placeholder="Select a LanceDB database folder" disabled={loading} />

                  <button type="button" onClick={() => void handleBrowseLocal()} disabled={loading}>
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

            <button type="button" className="button button-primary" onClick={onConnect} disabled={!canConnect || loading}>
              {loading ? "Connecting…" : connected ? "Reconnect" : "Test & connect"}
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
            <h3>Credentials are session-only</h3>
            <p>Vector Watcher does not persist your storage credentials in localStorage, cookies, or frontend environment variables.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
