import type { LanceConnectionState, LanceStorageType } from "@/api/lancedbAdmin";
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
  r2: "Cloudflare R2",
  s3: "Amazon S3",
  local: "Local LanceDB",
};

export default function ConnectionTab({ connection, loading, error, connected, onChange, onConnect, onDisconnect }: ConnectionTabProps) {
  const [showSecret, setShowSecret] = useState(false);

  const storageLabel = STORAGE_LABELS[connection.storage];

  const canConnect = useMemo(() => {
    if (!connection.name.trim()) return false;

    if (connection.storage === "local") {
      return true;
    }

    if (!connection.bucket.trim()) return false;
    if (!connection.accessKeyId.trim()) return false;
    if (!connection.secretAccessKey.trim()) return false;

    if (connection.storage === "r2") {
      return Boolean(connection.endpoint.trim());
    }

    return Boolean(connection.region.trim());
  }, [connection]);

  const update = (patch: Partial<LanceConnectionState>) => {
    onChange({
      ...connection,
      ...patch,
    });
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
              <span>Connection name</span>
              <input
                value={connection.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="My LanceDB"
                disabled={loading}
              />
            </label>

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
                <option value="r2">Cloudflare R2</option>
                <option value="s3">Amazon S3</option>
                <option value="local">Local LanceDB</option>
              </select>
            </label>

            {connection.storage !== "local" && (
              <>
                <label className="field field-full">
                  <span>Database path</span>
                  <input
                    value={connection.path}
                    onChange={(event) => update({ path: event.target.value })}
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
                    onChange={(event) => update({ bucket: event.target.value })}
                    placeholder="threadzip-bucket"
                    disabled={loading}
                  />
                </label>

                <label className="field">
                  <span>Region</span>
                  <input
                    value={connection.region}
                    onChange={(event) => update({ region: event.target.value })}
                    placeholder={connection.storage === "r2" ? "auto" : "ap-south-1"}
                    disabled={loading}
                  />
                </label>

                <label className="field field-full">
                  <span>{connection.storage === "r2" ? "R2 endpoint" : "S3 endpoint (optional)"}</span>

                  <input
                    value={connection.endpoint}
                    onChange={(event) =>
                      update({
                        endpoint: event.target.value,
                      })
                    }
                    placeholder={connection.storage === "r2" ? "https://<account-id>.r2.cloudflarestorage.com" : "https://s3.amazonaws.com"}
                    disabled={loading}
                  />
                </label>

                <label className="field">
                  <span>Access key</span>
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
                  <span>Secret key</span>
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

                {connection.storage === "s3" && (
                  <label className="field field-full">
                    <span>Session token</span>
                    <input
                      type="password"
                      value={connection.sessionToken}
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

            {connection.storage === "local" && (
              <div className="local-source-note field-full">
                <strong>Local database</strong>
                <p>The database path is resolved by the backend. The desktop application does not send a browser filesystem path.</p>
              </div>
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
              {connection.storage === "r2"
                ? "Uses the S3-compatible Cloudflare R2 API."
                : connection.storage === "s3"
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
