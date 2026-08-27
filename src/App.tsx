import { useState } from "react";
import "./App.css";

type ConnectionFormProps = {
  onClose: () => void;
};

function ConnectionForm({ onClose }: ConnectionFormProps) {
  return (
    <div className="connection-page">
      <div className="connection-header">
        <div>
          <h2>Add Connection</h2>
          <p>Connect to a LanceDB database.</p>
        </div>

        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
      </div>

      <div className="connection-card">
        <label>
          Connection name
          <input placeholder="My R2 Database" />
        </label>

        <label>
          Storage provider
          <select defaultValue="r2">
            <option value="r2">Cloudflare R2</option>
            <option value="s3">AWS S3</option>
            <option value="s3-compatible">S3 Compatible</option>
            <option value="local">Local LanceDB</option>
          </select>
        </label>

        <label>
          Endpoint
          <input placeholder="https://xxxx.r2.cloudflarestorage.com" />
        </label>

        <label>
          Bucket
          <input placeholder="my-lancedb" />
        </label>

        <div className="form-row">
          <label>
            Access Key ID
            <input placeholder="Access key" />
          </label>

          <label>
            Secret Access Key
            <input type="password" placeholder="Secret key" />
          </label>
        </div>

        <div className="form-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button className="primary-button">Validate Connection</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [showConnection, setShowConnection] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">V</div>

          <div>
            <h1>Vector Watcher</h1>
            <span>LanceDB Explorer</span>
          </div>
        </div>

        <button className="icon-button" title="Settings">
          ⚙
        </button>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-header">
            <span>Connections</span>

            <button
              className="add-button"
              onClick={() => setShowConnection(true)}
              title="Add connection"
            >
              +
            </button>
          </div>

          <div className="empty-connections">
            <div className="empty-icon">⌁</div>

            <p>No connections</p>

            <span>Add an S3 or R2 connection</span>
          </div>
        </aside>

        <main className="content">
          {!showConnection ? (
            <div className="welcome">
              <div className="welcome-icon">V</div>

              <h2>Welcome to Vector Watcher</h2>

              <p>
                Explore LanceDB databases stored locally,
                <br />
                on Cloudflare R2, AWS S3, or S3-compatible storage.
              </p>

              <button
                className="primary-button"
                onClick={() => setShowConnection(true)}
              >
                Add Connection
              </button>
            </div>
          ) : (
            <ConnectionForm onClose={() => setShowConnection(false)} />
          )}
        </main>
      </div>

      <footer className="statusbar">
        <span>● Ready</span>
        <span>Vector Watcher</span>
      </footer>
    </div>
  );
}

export default App;
